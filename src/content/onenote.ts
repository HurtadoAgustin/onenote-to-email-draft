import type { ExtractOneNotePayload, ExtractOneNoteResponse, RuntimeMessage } from "../utils/types";

const extractTextFromOneNote = (
  message: ExtractOneNotePayload
): ExtractOneNoteResponse => {
  const selector = message.config.selectors.oneNoteRoot?.trim();
  const root = selector ? document.querySelector<HTMLElement>(selector) : document.body;

  if (!root) {
    return {
      ok: false,
      logs: ["❌ No se encontró el contenedor de OneNote"]
    };
  }

  const text = root.innerText?.trim() ?? "";

  if (!text) {
    return {
      ok: false,
      logs: ["❌ OneNote no devolvió texto visible"]
    };
  }

  return {
    ok: true,
    text,
    logs: ["✅ Página OneNote leída"]
  };
};

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type !== "EXTRACT_ONENOTE_TEXT") return false;

  sendResponse(extractTextFromOneNote(message));
  return true;
});
