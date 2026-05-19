import { getConfig } from "../utils/config";
import { parseStructuredText } from "../utils/parser";
import { renderTemplate } from "../utils/template";
import type { GenerateMailResponse, OneNoteExtractResponse, OutlookInsertResponse } from "../utils/types";

const ONENOTE_CONTENT_FILE = "content/onenote.js";
const OUTLOOK_CONTENT_FILE = "content/outlook.js";

const sendTabMessage = async <TResponse>(
  tabId: number,
  message: unknown
): Promise<TResponse> => chrome.tabs.sendMessage(tabId, message) as Promise<TResponse>;

const injectContentScript = async (tabId: number, file: string): Promise<void> => {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [file]
  });
};

const ensureContentScript = async (
  tabId: number,
  pingType: string,
  file: string
): Promise<void> => {
  try {
    await sendTabMessage(tabId, { type: pingType });
  } catch {
    await injectContentScript(tabId, file);
  }
};

const waitForTabComplete = async (
  tabId: number,
  timeoutMs = 30000
): Promise<boolean> =>
  new Promise(resolve => {
    let done = false;

    const finish = (value: boolean) => {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(listener);
      clearTimeout(timeoutId);
      resolve(value);
    };

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === "complete") finish(true);
    };

    const timeoutId = setTimeout(() => finish(false), timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);

    chrome.tabs.get(tabId).then(tab => {
      if (tab.status === "complete") finish(true);
    }).catch(() => finish(false));
  });

const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
};

const buildDraftFromActiveTab = async (): Promise<GenerateMailResponse> => {
  const config = await getConfig();
  const activeTab = await getActiveTab();

  if (!activeTab?.id) {
    return { ok: false, logs: ["❌ No se encontró la pestaña activa"] };
  }

  await ensureContentScript(activeTab.id, "PING_ONENOTE_CONTENT", ONENOTE_CONTENT_FILE);

  const extractResponse = await sendTabMessage<OneNoteExtractResponse>(activeTab.id, {
    type: "EXTRACT_ONENOTE_DATA",
    config
  });

  if (!extractResponse.ok || !extractResponse.text) {
    return {
      ok: false,
      logs: extractResponse.logs
    };
  }

  const parsed = parseStructuredText(extractResponse.text, config);

  if (!config.flags.allowIncompleteFields && parsed.missingRequiredFields.length > 0) {
    return {
      ok: false,
      logs: [
        ...extractResponse.logs,
        ...parsed.logs,
        "❌ Hay campos requeridos faltantes. Revisá la página OneNote o la configuración."
      ]
    };
  }

  const templateData = {
    ...parsed.data,
    firma: config.flags.insertSignature ? config.signatureHtml : ""
  };

  const subject = renderTemplate(config.subjectTemplate, templateData);
  const html = renderTemplate(config.bodyTemplate, templateData, ["firma"]);

  const outlookTab = await chrome.tabs.create({
    url: config.mailUrl,
    active: true
  });

  if (!outlookTab.id) {
    return {
      ok: false,
      logs: [
        ...extractResponse.logs,
        ...parsed.logs,
        "❌ No se pudo abrir Outlook/Mail2"
      ]
    };
  }

  const loaded = await waitForTabComplete(outlookTab.id);

  if (!loaded) {
    return {
      ok: false,
      logs: [
        ...extractResponse.logs,
        ...parsed.logs,
        "❌ Outlook/Mail2 tardó demasiado en cargar"
      ]
    };
  }

  await ensureContentScript(outlookTab.id, "PING_OUTLOOK_CONTENT", OUTLOOK_CONTENT_FILE);

  const insertResponse = await sendTabMessage<OutlookInsertResponse>(outlookTab.id, {
    type: "INSERT_OUTLOOK_DRAFT",
    subject,
    html,
    config
  });

  return {
    ok: insertResponse.ok,
    logs: [
      ...extractResponse.logs,
      ...parsed.logs,
      ...insertResponse.logs
    ]
  };
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GENERATE_MAIL_FROM_CURRENT_TAB") return;

  void buildDraftFromActiveTab()
    .then(sendResponse)
    .catch(error => {
      sendResponse({
        ok: false,
        logs: [`❌ Error inesperado: ${error instanceof Error ? error.message : String(error)}`]
      });
    });

  return true;
});
