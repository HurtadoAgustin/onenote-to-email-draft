import { dispatchEditorEvents, setNativeInputValue, waitForElement } from "../utils/dom";
import type { ExtensionConfig, OutlookInsertResponse } from "../utils/types";

declare global {
  interface Window {
    __onenoteDraftBridgeOutlookLoaded?: boolean;
  }
}

const clickNewMailIfNeeded = async (config: ExtensionConfig): Promise<string[]> => {
  const logs: string[] = [];
  const bodySelector = config.selectors.outlookBody || "";
  const existingBody = bodySelector ? document.querySelector(bodySelector) : null;

  if (existingBody) return logs;

  const buttonSelector = config.selectors.outlookNewMailButton;

  if (!buttonSelector) {
    logs.push("⚠️ No hay selector configurado para abrir compose");
    return logs;
  }

  const newMailButton = await waitForElement<HTMLElement>(buttonSelector, 6000);

  if (!newMailButton) {
    logs.push("⚠️ No se encontró botón de nuevo mail; se intentará detectar compose directamente");
    return logs;
  }

  newMailButton.click();
  logs.push("✅ Compose abierto");
  return logs;
};

const insertSubject = (subjectElement: Element, subject: string): void => {
  const element = subjectElement as HTMLElement;
  element.focus();

  if (subjectElement instanceof HTMLInputElement) {
    setNativeInputValue(subjectElement, subject);
    return;
  }

  subjectElement.textContent = subject;
  dispatchEditorEvents(subjectElement);
};

const insertBodyHtml = (bodyElement: HTMLElement, html: string): void => {
  bodyElement.focus();

  const inserted = document.execCommand("insertHTML", false, html);

  if (!inserted) {
    bodyElement.innerHTML = html;
  }

  dispatchEditorEvents(bodyElement);
};

const insertDraft = async (
  subject: string,
  html: string,
  config: ExtensionConfig
): Promise<OutlookInsertResponse> => {
  const logs: string[] = [];
  logs.push(...(await clickNewMailIfNeeded(config)));

  const subjectSelector = config.selectors.outlookSubject;
  const bodySelector = config.selectors.outlookBody;

  if (!subjectSelector || !bodySelector) {
    return {
      ok: false,
      logs: ["❌ Faltan selectores de subject/body en la configuración"]
    };
  }

  const subjectElement = await waitForElement<Element>(subjectSelector, 20000);
  const bodyElement = await waitForElement<HTMLElement>(bodySelector, 20000);

  if (!subjectElement) {
    return {
      ok: false,
      logs: [...logs, "❌ No se encontró el campo Asunto"]
    };
  }

  if (!bodyElement) {
    return {
      ok: false,
      logs: [...logs, "❌ No se encontró el cuerpo del mail"]
    };
  }

  insertSubject(subjectElement, subject);
  logs.push("✅ Asunto insertado");

  insertBodyHtml(bodyElement, html);
  logs.push("✅ Cuerpo HTML insertado");
  logs.push("✅ Draft listo para revisión manual");

  return { ok: true, logs };
};

if (!window.__onenoteDraftBridgeOutlookLoaded) {
  window.__onenoteDraftBridgeOutlookLoaded = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING_OUTLOOK_CONTENT") {
      sendResponse({ ok: true });
      return;
    }

    if (message.type !== "INSERT_OUTLOOK_DRAFT") return;

    void insertDraft(message.subject, message.html, message.config).then(sendResponse);
    return true;
  });
}
