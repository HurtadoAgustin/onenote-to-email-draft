import type { FieldMapping, TemplateData, TemplateValue } from "../types";

export const isEmptyTemplateValue = (value: TemplateValue | undefined): boolean => {
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => !item.text.trim());
  }

  return !value?.trim();
};

export const buildFoundFieldLogs = (
  data: TemplateData,
  fieldMappings: FieldMapping[]
): string[] =>
  fieldMappings.map(mapping =>
    isEmptyTemplateValue(data[mapping.key])
      ? `⚠️ ${mapping.key} faltante`
      : `✅ ${mapping.key} encontrado`
  );

export const applyEmptyFieldFallback = (
  data: TemplateData,
  fieldKeys: string[],
  emptyFieldFallback: string
): TemplateData => {
  const fallback = emptyFieldFallback.trim();

  if (!fallback) return data;

  return fieldKeys.reduce<TemplateData>((acc, key) => {
    const currentValue = acc[key];

    if (!isEmptyTemplateValue(currentValue)) return acc;

    return {
      ...acc,
      [key]: Array.isArray(currentValue)
        ? [{ text: fallback, level: 0 }]
        : fallback
    };
  }, { ...data });
};
