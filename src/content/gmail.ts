import { insertHtmlIntoContentEditable, setNativeInputValue, waitForElement } from "../utils/dom";
import type { InsertGmailDraftPayload, InsertGmailDraftResponse, RuntimeMessage } from "../utils/types";

const findLatestComposeDialog = (selector: string): HTMLElement | null => {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return dialogs[dialogs.length - 1] ?? null;
};

const insertGmailDraft = async (
  message: InsertGmailDraftPayload
): Promise<InsertGmailDraftResponse> => {
  const composeSelector = message.config.selectors.gmailComposeDialog?.trim() || "div[role='dialog']";
  const subjectSelector = message.config.selectors.gmailSubject?.trim() || "input[name='subjectbox']";
  const bodySelector = message.config.selectors.gmailBody?.trim() || "div[aria-label='Message Body'][contenteditable='true'], div[role='textbox'][contenteditable='true']";

  await waitForElement<HTMLElement>(composeSelector, 20000);

  const composeDialog = findLatestComposeDialog(composeSelector) ?? document.body;
  const subjectElement =
    composeDialog.querySelector<HTMLInputElement>(subjectSelector) ??
    (await waitForElement<HTMLInputElement>(subjectSelector, 15000));
  const bodyElement =
    composeDialog.querySelector<HTMLElement>(bodySelector) ??
    (await waitForElement<HTMLElement>(bodySelector, 15000));

  if (!subjectElement) {
    return {
      ok: false,
      logs: ["❌ Gmail subject field not found"]
    };
  }

  if (!bodyElement) {
    return {
      ok: false,
      logs: ["❌ Gmail compose body not found"]
    };
  }

  subjectElement.focus();
  setNativeInputValue(subjectElement, message.subject);
  insertHtmlIntoContentEditable(bodyElement, message.html);

  return {
    ok: true,
    logs: ["✅ Gmail draft created for manual review"]
  };
};

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type !== "INSERT_GMAIL_DRAFT") return false;

  void insertGmailDraft(message)
    .then(sendResponse)
    .catch(error => {
      sendResponse({
        ok: false,
        logs: [
          "❌ Error while inserting the Gmail draft",
          error instanceof Error ? error.message : String(error)
        ]
      });
    });

  return true;
});
