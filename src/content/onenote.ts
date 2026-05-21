import type { ExtractOneNotePayload, ExtractOneNoteResponse, RuntimeMessage } from "../utils/types";

const extractTextFromOneNote = (
  message: ExtractOneNotePayload
): ExtractOneNoteResponse => {
  const selector = message.config.selectors.oneNoteRoot?.trim();
  const root = selector ? document.querySelector<HTMLElement>(selector) : document.body;

  if (!root) {
    return {
      ok: false,
      logs: ["❌ OneNote container not found"]
    };
  }

  const text = root.innerText?.trim() ?? "";

  if (!text) {
    return {
      ok: false,
      logs: ["❌ OneNote did not return visible text"]
    };
  }

  return {
    ok: true,
    text,
    logs: ["✅ OneNote page read"]
  };
};

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type !== "EXTRACT_ONENOTE_TEXT") return false;

  sendResponse(extractTextFromOneNote(message));
  return true;
});
