import { getConfig } from "../utils/config";
import { getMissingRequiredFields, parseStructuredText } from "../utils/parser";
import { renderTemplate } from "../utils/template";
import type {
  ExtractOneNoteResponse,
  GenerateDraftResponse,
  InsertGmailDraftResponse,
  RuntimeMessage,
  TemplateData,
  TemplateValue
} from "../utils/types";

type DebugElementSnapshot = {
  index: number;
  tag: string;
  id: string;
  className: string;
  role: string;
  ariaLabel: string;
  contentEditable: string;
  text: string;
  textLength: number;
  childElementCount: number;
  depth: number;
  parentTag: string;
  closestListTag: string;
  closestListText: string;
  color: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
  display: string;
  visibility: string;
  whiteSpace: string;
  marginLeft: string;
  paddingLeft: string;
  textIndent: string;
  listStyleType: string;
  rectLeft: number;
  rectTop: number;
  rectWidth: number;
  rectHeight: number;
  computedLevelHint: number;
  htmlPreview: string;
};

type ExtractedFrameText = {
  url: string;
  title: string;
  text: string;
  textLength: number;
  debug: {
    url: string;
    title: string;
    charset: string;
    readyState: string;
    locationHost: string;
    locationPathname: string;
    selectedRootMatched: boolean;
    selectedRootSelector: string;
    selectedRootTag: string;
    bodyTextLength: number;
    bodyTextPreview: string;
    bodyTextLines: string[];
    bodyInnerHtmlLength: number;
    bodyInnerHtmlPreview: string;
    extractedTextLength: number;
    extractedTextPreview: string;
    selectionText: string;
    activeElementTag: string;
    activeElementText: string;
    visibleElementCount: number;
    debugElementCount: number;
    debugElementsLimitReached: boolean;
    minRectLeft: number;
    elements: DebugElementSnapshot[];
  };
};

const ONE_NOTE_DEBUG_ENABLED = true;

const sendMessageToTab = async <TResponse>(
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
      lastError = error instanceof Error ? error.message : String(error);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(lastError);
};

const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
};

const buildFoundFieldLogs = (
  data: TemplateData,
  fieldKeys: string[]
): string[] =>
  fieldKeys.map(key =>
    isEmptyTemplateValue(data[key])
      ? `⚠️ ${key} faltante`
      : `✅ ${key} encontrado`
  );

const isEmptyTemplateValue = (value: TemplateValue | undefined): boolean => {
  if (Array.isArray(value)) return value.length === 0;
  return !value?.trim();
};

const applyEmptyFieldFallback = (
  data: TemplateData,
  fieldKeys: string[],
  emptyFieldFallback: string
): TemplateData => {
  const fallback = emptyFieldFallback.trim();

  if (!fallback) return data;

  return fieldKeys.reduce<TemplateData>((acc, key) => ({
    ...acc,
    [key]: isEmptyTemplateValue(acc[key]) ? fallback : acc[key]
  }), {
    ...data
  });
};

const logOneNoteExtractionDebug = (frameResults: ExtractedFrameText[]): void => {
  if (!ONE_NOTE_DEBUG_ENABLED) return;

  console.groupCollapsed("🔎 OneNote full extraction debug");

  console.table(
    frameResults.map((frame, index) => ({
      frame: index,
      url: frame.url,
      title: frame.title,
      textLength: frame.textLength,
      bodyTextLength: frame.debug.bodyTextLength,
      bodyInnerHtmlLength: frame.debug.bodyInnerHtmlLength,
      visibleElementCount: frame.debug.visibleElementCount,
      debugElementCount: frame.debug.debugElementCount,
      limitReached: frame.debug.debugElementsLimitReached,
      selectedRootMatched: frame.debug.selectedRootMatched,
      selectedRootTag: frame.debug.selectedRootTag
    }))
  );

  frameResults.forEach((frame, index) => {
    console.groupCollapsed(`Frame ${index}: ${frame.url}`);
    console.log("Frame debug object:", frame.debug);
    console.log("Extracted text:", frame.text);
    console.log("Body text lines:", frame.debug.bodyTextLines);
    console.log("Body innerHTML preview:", frame.debug.bodyInnerHtmlPreview);
    console.table(frame.debug.elements);
    console.groupEnd();
  });

  console.groupEnd();
};

const extractOneNoteTextFromTab = async (
  tabId: number,
  rootSelector?: string
): Promise<ExtractOneNoteResponse> => {
  try {
    const results = await chrome.scripting.executeScript({
      target: {
        tabId,
        allFrames: true
      },
      args: [rootSelector ?? "", ONE_NOTE_DEBUG_ENABLED],
      func: (selector: string, debugEnabled: boolean): ExtractedFrameText => {
        const MAX_DEBUG_ELEMENTS = 1600;
        const MAX_TEXT_PREVIEW = 1000;
        const MAX_HTML_PREVIEW = 30000;
        const MAX_BODY_LINES = 500;

        const truncate = (value: string, limit: number): string =>
          value.length > limit ? `${value.slice(0, limit)}…[truncated]` : value;

        const normalizeText = (value: string): string =>
          value
            .replace(/\u00a0/g, " ")
            .replace(/\r/g, "\n")
            .split("\n")
            .map(line => line.replace(/[ \t]+$/g, ""))
            .join("\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const normalizeSingleLine = (value: string): string =>
          value
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

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

        const safeQuerySelector = (value: string): Element | null => {
          try {
            return value ? document.querySelector(value) : null;
          } catch {
            return null;
          }
        };

        const getClassName = (element: Element): string => {
          const value = element.getAttribute("class") ?? "";
          return truncate(value, 300);
        };

        const getDepth = (element: Element): number => {
          let depth = 0;
          let current = element.parentElement;

          while (current) {
            depth += 1;
            current = current.parentElement;
          }

          return depth;
        };

        const isElementVisible = (element: Element): boolean => {
          const htmlElement = element as HTMLElement;
          const rect = htmlElement.getBoundingClientRect();
          const style = window.getComputedStyle(element);

          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
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

        const buildDebugElementSnapshot = (
          element: Element,
          index: number,
          minRectLeft: number
        ): DebugElementSnapshot => {
          const htmlElement = element as HTMLElement;
          const rect = htmlElement.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          const parent = element.parentElement;
          const parentStyle = parent ? window.getComputedStyle(parent) : null;
          const closestList = element.closest("li, ul, ol");
          const text = normalizeSingleLine(
            htmlElement.innerText || element.textContent || ""
          );
          const rectLeft = Math.round(rect.left * 100) / 100;
          const indentByRect = Math.max(0, rectLeft - minRectLeft);
          const marginLeft = parseFloat(style.marginLeft) || 0;
          const paddingLeft = parseFloat(style.paddingLeft) || 0;
          const parentPaddingLeft = parentStyle ? parseFloat(parentStyle.paddingLeft) || 0 : 0;
          const computedLevelHint = Math.max(
            0,
            Math.round(Math.max(indentByRect, marginLeft, paddingLeft, parentPaddingLeft) / 24)
          );

          return {
            index,
            tag: element.tagName.toLowerCase(),
            id: element.id || "",
            className: getClassName(element),
            role: element.getAttribute("role") ?? "",
            ariaLabel: element.getAttribute("aria-label") ?? "",
            contentEditable: element.getAttribute("contenteditable") ?? "",
            text: truncate(text, MAX_TEXT_PREVIEW),
            textLength: text.length,
            childElementCount: element.childElementCount,
            depth: getDepth(element),
            parentTag: parent?.tagName.toLowerCase() ?? "",
            closestListTag: closestList?.tagName.toLowerCase() ?? "",
            closestListText: closestList
              ? truncate(normalizeSingleLine((closestList as HTMLElement).innerText || closestList.textContent || ""), MAX_TEXT_PREVIEW)
              : "",
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            display: style.display,
            visibility: style.visibility,
            whiteSpace: style.whiteSpace,
            marginLeft: style.marginLeft,
            paddingLeft: style.paddingLeft,
            textIndent: style.textIndent,
            listStyleType: style.listStyleType,
            rectLeft,
            rectTop: Math.round(rect.top * 100) / 100,
            rectWidth: Math.round(rect.width * 100) / 100,
            rectHeight: Math.round(rect.height * 100) / 100,
            computedLevelHint,
            htmlPreview: truncate(element.outerHTML, 1500)
          };
        };

        const buildDebug = (root: Element, text: string): ExtractedFrameText["debug"] => {
          const bodyText = normalizeText(document.body?.innerText ?? "");
          const allElements = Array.from(root.querySelectorAll<HTMLElement>("*"));
          const visibleTextElements = allElements.filter(element => {
            const elementText = normalizeSingleLine(element.innerText || element.textContent || "");
            return elementText && isElementVisible(element);
          });
          const rectLeftValues = visibleTextElements.map(element => element.getBoundingClientRect().left);
          const minRectLeft = rectLeftValues.length
            ? Math.min(...rectLeftValues.map(value => Math.round(value * 100) / 100))
            : 0;
          const elements = visibleTextElements
            .slice(0, MAX_DEBUG_ELEMENTS)
            .map((element, index) => buildDebugElementSnapshot(element, index, minRectLeft));
          const activeElement = document.activeElement as HTMLElement | null;

          return {
            url: window.location.href,
            title: document.title,
            charset: document.characterSet,
            readyState: document.readyState,
            locationHost: window.location.host,
            locationPathname: window.location.pathname,
            selectedRootMatched: Boolean(selector && safeQuerySelector(selector)),
            selectedRootSelector: selector,
            selectedRootTag: root.tagName.toLowerCase(),
            bodyTextLength: bodyText.length,
            bodyTextPreview: truncate(bodyText, 5000),
            bodyTextLines: bodyText.split("\n").slice(0, MAX_BODY_LINES),
            bodyInnerHtmlLength: document.body?.innerHTML.length ?? 0,
            bodyInnerHtmlPreview: truncate(document.body?.innerHTML ?? "", MAX_HTML_PREVIEW),
            extractedTextLength: text.length,
            extractedTextPreview: truncate(text, 5000),
            selectionText: window.getSelection()?.toString() ?? "",
            activeElementTag: activeElement?.tagName.toLowerCase() ?? "",
            activeElementText: activeElement
              ? truncate(normalizeSingleLine(activeElement.innerText || activeElement.textContent || ""), MAX_TEXT_PREVIEW)
              : "",
            visibleElementCount: visibleTextElements.length,
            debugElementCount: elements.length,
            debugElementsLimitReached: visibleTextElements.length > MAX_DEBUG_ELEMENTS,
            minRectLeft,
            elements: debugEnabled ? elements : []
          };
        };

        const selectedRoot = safeQuerySelector(selector);
        const root = selectedRoot ?? document.body;
        const text = extractTextWithoutRedContent(root);

        return {
          url: window.location.href,
          title: document.title,
          text,
          textLength: text.length,
          debug: buildDebug(root, text)
        };
      }
    });

    const frameResults = results
      .map(result => result.result)
      .filter((result): result is ExtractedFrameText => Boolean(result?.text));

    logOneNoteExtractionDebug(frameResults);

    const uniqueTexts = Array.from(
      new Set(frameResults.map(result => result.text.trim()).filter(Boolean))
    );

    const combinedText = uniqueTexts.join("\n\n").trim();

    console.log("OneNote extraction frames:", frameResults);
    console.log("OneNote extracted text length:", combinedText.length);
    console.log("OneNote extracted text preview:", combinedText.slice(0, 3000));

    if (!combinedText) {
      return {
        ok: false,
        logs: [
          "❌ No se pudo extraer texto desde OneNote",
          "⚠️ La página puede no estar cargada o el contenido puede estar dentro de un frame no accesible"
        ]
      };
    }

    return {
      ok: true,
      text: combinedText,
      logs: [
        `✅ Texto extraído de OneNote (${combinedText.length} caracteres)`,
        `ℹ️ Frames analizados: ${results.length}`,
        "ℹ️ Debug completo disponible en Service worker → Console"
      ]
    };
  } catch (error) {
    return {
      ok: false,
      logs: [
        "❌ Error al extraer texto desde OneNote",
        error instanceof Error ? error.message : String(error)
      ]
    };
  }
};

const generateGmailDraft = async (): Promise<GenerateDraftResponse> => {
  const config = await getConfig();
  const activeTab = await getActiveTab();

  if (!activeTab?.id) {
    return {
      ok: false,
      logs: ["❌ No se encontró la pestaña activa"]
    };
  }

  const oneNoteResponse = await extractOneNoteTextFromTab(
    activeTab.id,
    config.selectors.oneNoteRoot
  );

  if (!oneNoteResponse.ok || !oneNoteResponse.text) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        "Verificá que la pestaña activa sea OneNote Web y que el dominio esté permitido en manifest.json"
      ]
    };
  }

  const data = parseStructuredText(oneNoteResponse.text, config.fieldMappings);
  const missingRequiredFields = getMissingRequiredFields(
    data,
    config.fieldMappings
  );
  const fieldKeys = config.fieldMappings.map(mapping => mapping.key);
  const fieldLogs = buildFoundFieldLogs(data, fieldKeys);
  const dataForTemplate = applyEmptyFieldFallback(
    data,
    fieldKeys,
    config.emptyFieldFallback
  );

  console.log("Parsed OneNote data:", data);
  console.log("Data used for Gmail template:", dataForTemplate);

  if (missingRequiredFields.length && !config.flags.allowIncompleteFields) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        ...fieldLogs,
        `❌ Faltan campos requeridos: ${missingRequiredFields.join(", ")}`
      ]
    };
  }

  const signatureHtml = config.flags.insertSignature ? config.signatureHtml : "";
  const subject = renderTemplate(config.subjectTemplate, dataForTemplate);
  const html = renderTemplate(config.bodyTemplate, {
    ...dataForTemplate,
    firma: signatureHtml
  });

  const gmailTab = await chrome.tabs.create({
    url: config.mailUrl,
    active: true
  });

  if (!gmailTab.id) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        ...fieldLogs,
        "❌ No se pudo abrir Gmail"
      ]
    };
  }

  const gmailResponse = await sendMessageToTab<InsertGmailDraftResponse>(
    gmailTab.id,
    {
      type: "INSERT_GMAIL_DRAFT",
      subject,
      html,
      config
    },
    20,
    1000
  ).catch(error => ({
    ok: false,
    logs: [
      "❌ No se pudo insertar el draft en Gmail",
      error instanceof Error ? error.message : String(error)
    ]
  }));

  return {
    ok: gmailResponse.ok,
    logs: [...oneNoteResponse.logs, ...fieldLogs, ...gmailResponse.logs]
  };
};

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type !== "GENERATE_GMAIL_DRAFT") return false;

    void generateGmailDraft()
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          ok: false,
          logs: [
            "❌ Error inesperado al generar el draft",
            error instanceof Error ? error.message : String(error)
          ]
        });
      });

    return true;
  }
);
