import type { FieldMapping } from "./types";

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const parseStructuredText = (
  text: string,
  mappings: FieldMapping[]
): Record<string, string> => {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  return mappings.reduce<Record<string, string>>((acc, mapping) => {
    const matchingLine = lines.find(line =>
      mapping.labels.some(label =>
        normalize(line).startsWith(`${normalize(label)}:`)
      )
    );

    if (!matchingLine) return acc;

    const [, ...valueParts] = matchingLine.split(":");
    const value = valueParts.join(":").trim();

    if (value) acc[mapping.key] = value;

    return acc;
  }, {});
};

export const getMissingRequiredFields = (
  data: Record<string, string>,
  mappings: FieldMapping[]
): string[] =>
  mappings
    .filter(mapping => mapping.required && !data[mapping.key])
    .map(mapping => mapping.key);
