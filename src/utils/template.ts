import type { ParsedListItem, TemplateData, TemplateValue } from "./types";

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const htmlKeys = new Set([
  "estimationBreakdownTable"
]);
const listItemKeys = new Set([
  "cambios",
  "integracion",
  "technicalConditions",
  "additionalContext"
]);

type ListNode = {
  text: string;
  children: ListNode[];
};

const getStringLineLevel = (line: string): number =>
  line.match(/^\t*/)?.[0].length ?? 0;

const parseStringAsListItems = (value: string): ParsedListItem[] =>
  value
    .split("\n")
    .map(line => ({
      text: line.replace(/^\t+/, "").trim(),
      level: getStringLineLevel(line)
    }))
    .filter(item => item.text);

const normalizeValueToListItems = (value: TemplateValue): ParsedListItem[] => {
  if (Array.isArray(value)) return value;
  return parseStringAsListItems(value);
};

const buildNestedList = (items: ParsedListItem[]): ListNode[] => {
  const root: ListNode[] = [];
  const stack: ListNode[] = [];

  items
    .filter(item => item.text.trim())
    .forEach(item => {
      const level = Math.max(0, item.level);
      const node: ListNode = {
        text: item.text.trim(),
        children: []
      };

      if (level === 0 || !stack[level - 1]) {
        root.push(node);
        stack[0] = node;
        stack.length = 1;
        return;
      }

      const parent = stack[level - 1];
      parent.children.push(node);
      stack[level] = node;
      stack.length = level + 1;
    });

  return root;
};

const renderNestedNodes = (nodes: ListNode[]): string =>
  nodes
    .map(node => {
      const childrenHtml = node.children.length
        ? `<ul>${renderNestedNodes(node.children)}</ul>`
        : "";

      return `<li>${escapeHtml(node.text)}${childrenHtml}</li>`;
    })
    .join("");

const renderListItems = (value: TemplateValue): string =>
  renderNestedNodes(buildNestedList(normalizeValueToListItems(value)));


const renderUpdateConsiderations = (value: TemplateValue): string => {
  const [title, ...details] = normalizeValueToListItems(value).filter(item =>
    item.text.trim()
  );

  if (!title) return "";

  const detailItemsHtml = details
    .map(item => `<li><em>${escapeHtml(item.text.trim())}</em></li>`)
    .join("");

  const detailsHtml = detailItemsHtml
    ? `<ul style="margin: 0 0 0 18px; padding-left: 18px; list-style-type: circle;">${detailItemsHtml}</ul>`
    : "";

  return `<div style="margin: 0 0 0 36px;">
  <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(title.text.trim())}</strong></p>
  ${detailsHtml}
</div>`;
};

const stringifyValue = (value: TemplateValue): string => {
  if (Array.isArray(value)) {
    return value.map(item => item.text).join(" ").trim();
  }

  return value;
};

const renderValue = (key: string, value: TemplateValue): string => {
  if (htmlKeys.has(key)) {
    return stringifyValue(value);
  }

  if (key === "updateConsiderations") {
    return renderUpdateConsiderations(value);
  }

  if (listItemKeys.has(key)) {
    return renderListItems(value);
  }

  return escapeHtml(stringifyValue(value)).replace(/\n/g, "<br />");
};

export const renderTemplate = (
  template: string,
  data: TemplateData,
  options: { escapeValues?: boolean } = { escapeValues: true }
): string => {
  if (options.escapeValues === false) {
    return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) =>
      stringifyValue(data[key] ?? "")
    );
  }

  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) =>
    renderValue(key, data[key] ?? "")
  );
};
