import type { FieldMapping, TemplateData, TemplateValue } from "../types";

export const isEmptyTemplateValue = (value: TemplateValue | undefined): boolean => {
  if (Array.isArray(value)) return value.length === 0;
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

  return fieldKeys.reduce<TemplateData>(
    (acc, key) => ({
      ...acc,
      [key]: isEmptyTemplateValue(acc[key]) ? fallback : acc[key]
    }),
    { ...data }
  );
};
