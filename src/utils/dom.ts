export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => window.setTimeout(resolve, ms));

export const waitForElement = async <T extends Element>(
  selector: string,
  timeoutMs = 15000
): Promise<T | null> =>
  new Promise(resolve => {
    const existing = document.querySelector<T>(selector);

    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector<T>(selector);

      if (!element) return;

      observer.disconnect();
      resolve(element);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });

export const setNativeInputValue = (element: HTMLInputElement, value: string) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  nativeInputValueSetter?.call(element, value);

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

export const insertHtmlIntoContentEditable = (
  element: HTMLElement,
  html: string
) => {
  element.focus();

  const selection = window.getSelection();
  const range = document.createRange();
  const gmailSignature = element.querySelector<HTMLElement>(
    ".gmail_signature, [data-smartmail='gmail_signature']"
  );

  if (gmailSignature) {
    range.setStartBefore(gmailSignature);
    range.collapse(true);
  } else {
    range.selectNodeContents(element);
    range.collapse(false);
  }

  selection?.removeAllRanges();
  selection?.addRange(range);

  const htmlWithSpacer = gmailSignature ? `${html}<br />` : html;
  const inserted = document.execCommand("insertHTML", false, htmlWithSpacer);

  if (!inserted) {
    if (gmailSignature) {
      gmailSignature.insertAdjacentHTML("beforebegin", htmlWithSpacer);
    } else {
      element.innerHTML = html;
    }

    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
};
