import type { ExtractOneNoteResponse, OneNoteDomTextItem } from "../types";
import { getErrorMessage } from "./error";

type ExtractedFrameText = {
  url: string;
  title: string;
  text: string;
  textLength: number;
  domTextItems: OneNoteDomTextItem[];
};

export const extractOneNoteTextFromTab = async (
  tabId: number,
  rootSelector?: string
): Promise<ExtractOneNoteResponse> => {
  try {
    const results = await chrome.scripting.executeScript({
      target: {
        tabId,
        allFrames: true
      },
      args: [rootSelector ?? ""],
      func: (selector: string): ExtractedFrameText => {
        const normalizeText = (value: string): string =>
          value
            .replace(/\u00a0/g, " ")
            .replace(/\r/g, "\n")
            .split("\n")
            .map(line => line.replace(/[ \t]+$/g, ""))
            .join("\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const parsePx = (value: string): number => {
          const parsedValue = Number.parseFloat(value);
          return Number.isFinite(parsedValue) ? parsedValue : 0;
        };

        const parseRgbColor = (color: string): [number, number, number] | null => {
          const rgbMatch = color.match(
            /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i
          );

          if (rgbMatch) {
            return [
              Number(rgbMatch[1]),
              Number(rgbMatch[2]),
              Number(rgbMatch[3])
            ];
          }

          const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

          if (hexMatch) {
            return [
              parseInt(hexMatch[1], 16),
              parseInt(hexMatch[2], 16),
              parseInt(hexMatch[3], 16)
            ];
          }

          return null;
        };

        const isRedLike = (color: string): boolean => {
          const rgb = parseRgbColor(color);
          if (!rgb) return false;

          const [r, g, b] = rgb;

          return r >= 140 && g <= 130 && b <= 130 && r > g * 1.25 && r > b * 1.25;
        };

        const normalizeCandidateText = (value: string): string =>
          value
            .replace(/\u00a0/g, " ")
            .replace(/[\t ]+/g, " ")
            .replace(/\n+/g, " ")
            .trim();

        const isBulletOnlyText = (value: string): boolean =>
          /^[oO○◦●•·▪▫■□‣⁃-]$/.test(value.trim());

        const safeQuerySelector = (value: string): Element | null => {
          try {
            return value ? document.querySelector(value) : null;
          } catch {
            return null;
          }
        };

        const removeUnwantedNodesFromClone = (
          originalNode: Node,
          cloneNode: Node
        ): void => {
          if (
            originalNode.nodeType === Node.ELEMENT_NODE &&
            cloneNode.nodeType === Node.ELEMENT_NODE
          ) {
            const originalElement = originalNode as Element;
            const cloneElement = cloneNode as Element;
            const style = window.getComputedStyle(originalElement);

            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              isRedLike(style.color)
            ) {
              cloneElement.remove();
              return;
            }
          }

          const originalChildren = Array.from(originalNode.childNodes);
          const cloneChildren = Array.from(cloneNode.childNodes);

          originalChildren.forEach((originalChild, index) => {
            const cloneChild = cloneChildren[index];

            if (cloneChild) {
              removeUnwantedNodesFromClone(originalChild, cloneChild);
            }
          });
        };

        const extractTextWithoutRedContent = (root: Element): string => {
          const clone = root.cloneNode(true) as HTMLElement;

          clone
            .querySelectorAll("script, style, noscript, svg")
            .forEach(element => element.remove());

          removeUnwantedNodesFromClone(root, clone);

          const wrapper = document.createElement("div");

          wrapper.style.position = "fixed";
          wrapper.style.left = "-100000px";
          wrapper.style.top = "0";
          wrapper.style.width = "1200px";
          wrapper.style.opacity = "0";
          wrapper.style.pointerEvents = "none";
          wrapper.style.zIndex = "-1";

          wrapper.appendChild(clone);
          document.body.appendChild(wrapper);

          const text = wrapper.innerText || wrapper.textContent || "";

          wrapper.remove();

          return normalizeText(text);
        };

        const getDomTextItems = (root: Element): OneNoteDomTextItem[] => {
          const candidates = Array.from(
            root.querySelectorAll<HTMLElement>("span.TextRun, span.NormalTextRun")
          );

          return candidates.reduce<OneNoteDomTextItem[]>((acc, element, index) => {
            const closestListItem = element.closest<HTMLElement>("li");
            if (!closestListItem) return acc;

            const style = window.getComputedStyle(element);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              isRedLike(style.color)
            ) {
              return acc;
            }

            const text = normalizeCandidateText(element.innerText || element.textContent || "");
            if (!text || isBulletOnlyText(text)) return acc;

            const marker = closestListItem.querySelector<HTMLElement>(".ListMarker");
            const markerStyle = marker ? window.getComputedStyle(marker) : null;
            const listItemStyle = window.getComputedStyle(closestListItem);
            const elementRect = element.getBoundingClientRect();
            const listItemRect = closestListItem.getBoundingClientRect();
            const markerRect = marker?.getBoundingClientRect();
            const markerMarginLeft = parsePx(markerStyle?.marginLeft ?? "0");
            const ariaLevel = Number.parseInt(
              closestListItem.getAttribute("aria-level") ?? "0",
              10
            );

            acc.push({
              index,
              text,
              closestListText: normalizeCandidateText(
                closestListItem.innerText || closestListItem.textContent || ""
              ),
              className: String(element.className ?? ""),
              tagName: element.tagName.toLowerCase(),
              rectLeft: elementRect.left,
              listItemRectLeft: listItemRect.left,
              markerRectLeft: markerRect?.left ?? 0,
              markerMarginLeft,
              computedLevelHint: Math.round(elementRect.left - markerMarginLeft),
              ariaLevel: Number.isFinite(ariaLevel) ? ariaLevel : 0,
              listStyleType: listItemStyle.listStyleType
            });

            return acc;
          }, []);
        };

        const selectedRoot = safeQuerySelector(selector);
        const root = selectedRoot ?? document.body;
        const text = extractTextWithoutRedContent(root);
        const domTextItems = getDomTextItems(root);

        return {
          url: window.location.href,
          title: document.title,
          text,
          textLength: text.length,
          domTextItems
        };
      }
    });

    const frameResults = results
      .map(result => result.result)
      .filter((result): result is ExtractedFrameText => Boolean(result?.text));

    const uniqueTexts = Array.from(
      new Set(frameResults.map(result => result.text.trim()).filter(Boolean))
    );

    const combinedText = uniqueTexts.join("\n\n").trim();
    const domTextItems = frameResults.flatMap(result => result.domTextItems ?? []);

    console.log("OneNote extraction frames:", frameResults);
    console.log("OneNote extracted text length:", combinedText.length);
    console.log("OneNote extracted text preview:", combinedText.slice(0, 3000));
    console.log("OneNote DOM text item count:", domTextItems.length);

    if (!combinedText) {
      return {
        ok: false,
        logs: [
          "❌ Text could not be extracted from OneNote",
          "⚠️ The page may not be fully loaded or the content may be inside an inaccessible frame"
        ]
      };
    }

    return {
      ok: true,
      text: combinedText,
      domTextItems,
      logs: [
        `✅ Text extracted from OneNote (${combinedText.length} characters)`,
        `ℹ️ Frames analyzed: ${results.length}`,
        `ℹ️ List DOM elements analyzed: ${domTextItems.length}`
      ]
    };
  } catch (error) {
    return {
      ok: false,
      logs: [
        "❌ Error while extracting text from OneNote",
        getErrorMessage(error)
      ]
    };
  }
};
