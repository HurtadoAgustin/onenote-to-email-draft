import { getConfig } from "../utils/config";
import { getMissingRequiredFields, parseStructuredText } from "../utils/parser";
import { renderTemplate } from "../utils/template";
import type {
  ExtractOneNoteResponse,
  GenerateDraftResponse,
  InsertGmailDraftResponse,
  RuntimeMessage
} from "../utils/types";

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

const generateGmailDraft = async (): Promise<GenerateDraftResponse> => {
  const config = await getConfig();
  const activeTab = await getActiveTab();

  if (!activeTab?.id) {
    return {
      ok: false,
      logs: ["❌ No se encontró la pestaña activa"]
    };
  }

  const oneNoteResponse = await sendMessageToTab<ExtractOneNoteResponse>(
    activeTab.id,
    {
      type: "EXTRACT_ONENOTE_TEXT",
      config
    },
    1,
    0
  ).catch(() => null);

  if (!oneNoteResponse?.ok || !oneNoteResponse.text) {
    return {
      ok: false,
      logs: [
        "❌ No se pudo leer OneNote",
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

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
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
});
