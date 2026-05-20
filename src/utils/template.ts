export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const htmlKeys = new Set(["firma"]);
const listItemKeys = new Set(["cambios", "integracion"]);

const renderListItems = (value: string): string =>
  value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");

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
