import type { RuntimeMessage } from "../types";
import { getErrorMessage } from "./error";

export const delay = (delayMs: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, delayMs));

export const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
};

export const sendMessageToTab = async <TResponse>(
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
      lastError = getErrorMessage(error);
      await delay(retryDelayMs);
    }
  }

  throw new Error(lastError);
};
