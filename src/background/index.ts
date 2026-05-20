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

const applyEmptyFieldFallback = (
  data: Record<string, string>,
  fieldKeys: string[],
  emptyFieldFallback: string
): Record<string, string> => {
  const fallback = emptyFieldFallback.trim();

  if (!fallback) return data;

  return fieldKeys.reduce<Record<string, string>>((acc, key) => ({
    ...acc,
    [key]: acc[key]?.trim() ? acc[key] : fallback
  }), {
    ...data
  });
};

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

        const parseRgbColor = (color: string): [number, number, number] | null => {
          const rgbMatch = color.match(
            /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i
          );

          if (rgbMatch) {
            return [
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            ];
          }

          const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

          if (hexMatch) {
            return [
              parseInt(hexMatch[1], 16),
              parseInt(hexMatch[2], 16),
              parseInt(hexMatch[3], 16)
            ];
          }

          return null;
        };

        const isRedLike = (color: string): boolean => {
          const rgb = parseRgbColor(color);
          if (!rgb) return false;

          const [r, g, b] = rgb;

          return r >= 140 && g <= 130 && b <= 130 && r > g * 1.25 && r > b * 1.25;
        };

        const safeQuerySelector = (value: string): Element | null => {
          try {
            return value ? document.querySelector(value) : null;
          } catch {
            return null;
          }
        };

        const removeUnwantedNodesFromClone = (
          originalNode: Node,
          cloneNode: Node
        ): void => {
          if (
            originalNode.nodeType === Node.ELEMENT_NODE &&
            cloneNode.nodeType === Node.ELEMENT_NODE
          ) {
            const originalElement = originalNode as Element;
            const cloneElement = cloneNode as Element;
            const style = window.getComputedStyle(originalElement);

            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              isRedLike(style.color)
            ) {
              cloneElement.remove();
              return;
            }
          }

          const originalChildren = Array.from(originalNode.childNodes);
          const cloneChildren = Array.from(cloneNode.childNodes);

          originalChildren.forEach((originalChild, index) => {
            const cloneChild = cloneChildren[index];

            if (cloneChild) {
              removeUnwantedNodesFromClone(originalChild, cloneChild);
            }
          });
        };

        const extractTextWithoutRedContent = (root: Element): string => {
          const clone = root.cloneNode(true) as HTMLElement;

          clone
            .querySelectorAll("script, style, noscript, svg")
            .forEach(element => element.remove());

          removeUnwantedNodesFromClone(root, clone);

          const wrapper = document.createElement("div");

          wrapper.style.position = "fixed";
          wrapper.style.left = "-100000px";
          wrapper.style.top = "0";
          wrapper.style.width = "1200px";
          wrapper.style.opacity = "0";
          wrapper.style.pointerEvents = "none";
          wrapper.style.zIndex = "-1";

          wrapper.appendChild(clone);
          document.body.appendChild(wrapper);

          const text = wrapper.innerText || wrapper.textContent || "";

          wrapper.remove();

          return normalizeText(text);
        };

        const selectedRoot = safeQuerySelector(selector);
        const root = selectedRoot ?? document.body;
        const text = extractTextWithoutRedContent(root);

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
      new Set(frameResults.map(result => result.text.trim()).filter(Boolean))
    );

    const combinedText = uniqueTexts.join("\n\n").trim();

    console.log("OneNote extraction frames:", frameResults);
    console.log("OneNote extracted text length:", combinedText.length);
    console.log("OneNote extracted text preview:", combinedText.slice(0, 3000));

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
  const dataForTemplate = applyEmptyFieldFallback(
    data,
    fieldKeys,
    config.emptyFieldFallback
  );

  console.log("Parsed OneNote data:", data);
  console.log("Data used for Gmail template:", dataForTemplate);

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
  const subject = renderTemplate(config.subjectTemplate, dataForTemplate);
  const html = renderTemplate(config.bodyTemplate, {
    ...dataForTemplate,
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
