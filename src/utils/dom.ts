/**
 * Waits until an element matching the selector appears in the DOM.
 */
export const waitForElement = async <T extends Element>(
  selector: string,
  timeout = 15000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const existingElement = document.querySelector<T>(selector);

    if (existingElement) {
      resolve(existingElement);

      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector<T>(selector);

      if (element) {
        observer.disconnect();

        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();

      reject(
        new Error(`Element not found for selector: ${selector}`)
      );
    }, timeout);
  });
};

/**
 * Replaces the entire Gmail compose body with the generated HTML.
 *
 * Why:
 * Gmail automatically injects the user's signature into the compose area.
 * Since the extension already controls the signature/template,
 * we remove Gmail's auto signature and fully replace the compose content.
 *
 * This avoids:
 * - duplicated signatures
 * - incorrect signature ordering
 * - inconsistent rendering between users
 */
export const insertHtmlIntoContentEditable = (
  element: HTMLElement,
  html: string
) => {
  element.focus();

  /**
   * Remove Gmail auto signature if present.
   */
  const gmailSignature = element.querySelector<HTMLElement>(
    ".gmail_signature, [data-smartmail='gmail_signature']"
  );

  if (gmailSignature) {
    gmailSignature.remove();
  }

  /**
   * Replace entire compose body.
   */
  element.innerHTML = html;

  /**
   * Notify Gmail editor state.
   */
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true
    })
  );
};

export const setNativeInputValue = (element: HTMLInputElement, value: string) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  nativeInputValueSetter?.call(element, value);

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
<<<<<<< HEAD
};
=======
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
>>>>>>> 1935757909261b875febcbe6c718979dca3862d1
