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
  rawKeys: string[] = []
): string => {
  const rawKeySet = new Set(rawKeys);

  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) => {
    const value = data[key] ?? "";
    return rawKeySet.has(key) ? value : escapeHtml(value);
  });
};
