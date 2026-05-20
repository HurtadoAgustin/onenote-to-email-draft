export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const htmlKeys = new Set(["firma"]);
const listItemKeys = new Set(["cambios", "integracion"]);

type ListNode = {
  text: string;
  children: ListNode[];
};

const parseNestedListItems = (value: string): ListNode[] => {
  const root: ListNode[] = [];
  let lastRootItem: ListNode | null = null;

  value
    .split("\n")
    .map(line => {
      const depth = line.match(/^\t+/)?.[0].length ?? 0;
      const text = line.replace(/^\t+/, "").trim();

      return {
        depth,
        text
      };
    })
    .filter(item => item.text)
    .forEach(item => {
      const node: ListNode = {
        text: item.text,
        children: []
      };

      if (item.depth > 0 && lastRootItem) {
        lastRootItem.children.push(node);
        return;
      }

      root.push(node);
      lastRootItem = node;
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

const renderListItems = (value: string): string =>
  renderNestedNodes(parseNestedListItems(value));

const renderValue = (key: string, value: string): string => {
  if (htmlKeys.has(key)) {
    return value;
  }

  if (listItemKeys.has(key)) {
    return renderListItems(value);
  }

  return escapeHtml(value).replace(/\n/g, "<br />");
};

export const renderTemplate = (
  template: string,
  data: Record<string, string>,
  options: { escapeValues?: boolean } = { escapeValues: true }
): string => {
  if (options.escapeValues === false) {
    return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) =>
      data[key] ?? ""
    );
  }

  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) =>
    renderValue(key, data[key] ?? "")
  );
};
