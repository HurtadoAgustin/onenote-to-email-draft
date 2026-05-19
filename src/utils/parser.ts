import type { ExtensionConfig, ParsedDataResult } from "./types";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLogName = (key: string): string =>
  key.charAt(0).toUpperCase() + key.slice(1);

export const parseStructuredText = (
  text: string,
  config: ExtensionConfig
): ParsedDataResult => {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const data: Record<string, string> = {};
  const logs: string[] = [];
  const missingRequiredFields: string[] = [];

  config.fieldMappings.forEach(mapping => {
    const labelPattern = mapping.labels.map(escapeRegExp).join("|");
    const regex = new RegExp(`^(${labelPattern})\\s*:\\s*(.*)$`, "i");
    const foundLine = lines.find(line => regex.test(line));

    if (!foundLine) {
      const logPrefix = mapping.required ? "❌" : "⚠️";
      logs.push(`${logPrefix} ${normalizeLogName(mapping.key)} faltante`);

      if (mapping.required) missingRequiredFields.push(mapping.key);
      return;
    }

    const value = foundLine.replace(regex, "$2").trim();

    if (!value) {
      const logPrefix = mapping.required ? "❌" : "⚠️";
      logs.push(`${logPrefix} ${normalizeLogName(mapping.key)} vacío`);

      if (mapping.required) missingRequiredFields.push(mapping.key);
      return;
    }

    data[mapping.key] = value;
    logs.push(`✅ ${normalizeLogName(mapping.key)} encontrado`);
  });

  return { data, logs, missingRequiredFields };
};
