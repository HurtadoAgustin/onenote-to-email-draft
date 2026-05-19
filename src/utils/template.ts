export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const renderTemplate = (
  template: string,
  data: Record<string, string>,
  options: { escapeValues?: boolean } = { escapeValues: true }
): string =>
  template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) => {
    const value = data[key] ?? "";
    return options.escapeValues === false ? value : escapeHtml(value);
  });
