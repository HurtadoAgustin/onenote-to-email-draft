import { getConfig } from "../utils/config";
import { getMissingRequiredFields, parseStructuredText } from "../utils/parser";
import { renderTemplate } from "../utils/template";
import type {
  ExtractOneNoteResponse,
  GenerateDraftResponse,
  InsertGmailDraftResponse,
  RuntimeMessage
} from "../utils/types";

type ExtractedFrameText = {
  url: string;
  title: string;
  text: string;
  textLength: number;
};

const sendMessageToTab = async <TResponse>(
  tabId: number,
  message: RuntimeMessage,
  retries = 10,
  retryDelayMs = 800
): Promise<TResponse> => {
  let lastError = "Unknown error";

  for (let index = 0; index < retries; index += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(lastError);
};

const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
};

const buildFoundFieldLogs = (
  data: Record<string, string>,
  fieldKeys: string[]
): string[] =>
  fieldKeys.map(key =>
    data[key] ? `✅ ${key} encontrado` : `⚠️ ${key} faltante`
  );

const extractOneNoteTextFromTab = async (
  tabId: number,
  rootSelector?: string
): Promise<ExtractOneNoteResponse> => {
  try {
    const results = await chrome.scripting.executeScript({
      target: {
        tabId,
        allFrames: true
      },
      args: [rootSelector ?? ""],
      func: (selector: string): ExtractedFrameText => {
        const normalizeText = (value: string): string =>
          value
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const safeQuerySelector = (value: string): Element | null => {
          try {
            return value ? document.querySelector(value) : null;
          } catch {
            return null;
          }
        };

        const getElementText = (element: Element | null): string => {
          if (!element) return "";
          const htmlElement = element as HTMLElement;
          return htmlElement.innerText || htmlElement.textContent || "";
        };

        const selectedRoot = safeQuerySelector(selector);
        const rootText = getElementText(selectedRoot ?? document.body);

        const contentEditableText = Array.from(
          document.querySelectorAll<HTMLElement>("[contenteditable='true']")
        )
          .map(element => element.innerText || element.textContent || "")
          .filter(Boolean)
          .join("\n");

        const roleTextboxText = Array.from(
          document.querySelectorAll<HTMLElement>("[role='textbox']")
        )
          .map(element => element.innerText || element.textContent || "")
          .filter(Boolean)
          .join("\n");

        const selectionText = window.getSelection()?.toString() ?? "";

        const text = normalizeText(
          [rootText, contentEditableText, roleTextboxText, selectionText]
            .filter(Boolean)
            .join("\n")
        );

        return {
          url: window.location.href,
          title: document.title,
          text,
          textLength: text.length
        };
      }
    });

    const frameResults = results
      .map(result => result.result)
      .filter((result): result is ExtractedFrameText => Boolean(result?.text));

    const uniqueTexts = Array.from(
      new Set(
        frameResults
          .map(result => result.text.trim())
          .filter(Boolean)
      )
    );

    const combinedText = uniqueTexts.join("\n\n").trim();

    console.log("OneNote extraction frames:", frameResults);
    console.log("OneNote extracted text length:", combinedText.length);
    console.log("OneNote extracted text preview:", combinedText.slice(0, 2000));

    if (!combinedText) {
      return {
        ok: false,
        logs: [
          "❌ No se pudo extraer texto desde OneNote",
          "⚠️ La página puede no estar cargada o el contenido puede estar dentro de un frame no accesible"
        ]
      };
    }

    return {
      ok: true,
      text: combinedText,
      logs: [
        `✅ Texto extraído de OneNote (${combinedText.length} caracteres)`,
        `ℹ️ Frames analizados: ${results.length}`
      ]
    };
  } catch (error) {
    return {
      ok: false,
      logs: [
        "❌ Error al extraer texto desde OneNote",
        error instanceof Error ? error.message : String(error)
      ]
    };
  }
};

const generateGmailDraft = async (): Promise<GenerateDraftResponse> => {
  const config = await getConfig();
  const activeTab = await getActiveTab();

  if (!activeTab?.id) {
    return {
      ok: false,
      logs: ["❌ No se encontró la pestaña activa"]
    };
  }

  const oneNoteResponse = await extractOneNoteTextFromTab(
    activeTab.id,
    config.selectors.oneNoteRoot
  );

  if (!oneNoteResponse.ok || !oneNoteResponse.text) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        "Verificá que la pestaña activa sea OneNote Web y que el dominio esté permitido en manifest.json"
      ]
    };
  }

  const data = parseStructuredText(oneNoteResponse.text, config.fieldMappings);
  const missingRequiredFields = getMissingRequiredFields(
    data,
    config.fieldMappings
  );
  const fieldKeys = config.fieldMappings.map(mapping => mapping.key);
  const fieldLogs = buildFoundFieldLogs(data, fieldKeys);

  console.log("Parsed OneNote data:", data);

  if (missingRequiredFields.length && !config.flags.allowIncompleteFields) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        ...fieldLogs,
        `❌ Faltan campos requeridos: ${missingRequiredFields.join(", ")}`
      ]
    };
  }

  const signatureHtml = config.flags.insertSignature ? config.signatureHtml : "";
  const subject = renderTemplate(config.subjectTemplate, data);
  const html = renderTemplate(config.bodyTemplate, {
    ...data,
    firma: signatureHtml
  });

  const gmailTab = await chrome.tabs.create({
    url: config.mailUrl,
    active: true
  });

  if (!gmailTab.id) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        ...fieldLogs,
        "❌ No se pudo abrir Gmail"
      ]
    };
  }

  const gmailResponse = await sendMessageToTab<InsertGmailDraftResponse>(
    gmailTab.id,
    {
      type: "INSERT_GMAIL_DRAFT",
      subject,
      html,
      config
    },
    20,
    1000
  ).catch(error => ({
    ok: false,
    logs: [
      "❌ No se pudo insertar el draft en Gmail",
      error instanceof Error ? error.message : String(error)
    ]
  }));

  return {
    ok: gmailResponse.ok,
    logs: [...oneNoteResponse.logs, ...fieldLogs, ...gmailResponse.logs]
  };
};

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type !== "GENERATE_GMAIL_DRAFT") return false;

    void generateGmailDraft()
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          ok: false,
          logs: [
            "❌ Error inesperado al generar el draft",
            error instanceof Error ? error.message : String(error)
          ]
        });
      });

    return true;
  }
);