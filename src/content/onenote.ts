import type { ExtensionConfig, OneNoteExtractResponse } from "../utils/types";

declare global {
  interface Window {
    __onenoteDraftBridgeOneNoteLoaded?: boolean;
  }
}

const getReadableText = (config: ExtensionConfig): string => {
  const selector = config.selectors.oneNoteRoot || "body";
  const root = document.querySelector<HTMLElement>(selector) ?? document.body;
  return root?.innerText?.trim() ?? "";
};

const extractOneNoteData = (config: ExtensionConfig): OneNoteExtractResponse => {
  const text = getReadableText(config);

  if (!text) {
    return {
      ok: false,
      logs: ["❌ No se pudo leer texto desde la página actual"]
    };
  }

  return {
    ok: true,
    text,
    logs: ["✅ Página leída correctamente"]
  };
};

if (!window.__onenoteDraftBridgeOneNoteLoaded) {
  window.__onenoteDraftBridgeOneNoteLoaded = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING_ONENOTE_CONTENT") {
      sendResponse({ ok: true });
      return;
    }

    if (message.type !== "EXTRACT_ONENOTE_DATA") return;

    const response = extractOneNoteData(message.config);
    sendResponse(response);
  });
}
