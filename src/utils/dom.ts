export const delay = async (ms: number): Promise<void> =>
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

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });

export const dispatchEditorEvents = (element: Element): void => {
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
};

export const setNativeInputValue = (element: HTMLInputElement, value: string): void => {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  dispatchEditorEvents(element);
};
