import type { FieldMapping } from "./types";

const normalizeForMatch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:：]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const cleanLine = (value: string): string =>
  value
    .replace(/^[•·▪▫◦‣⁃-]\s*/, "")
    .replace(/^[oO]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

const getLines = (text: string): string[] =>
  text
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => cleanLine(line))
    .filter(Boolean);

const headingGroups = {
  title: ["title", "titulo", "título"],
  description: ["description", "descripcion", "descripción"],
  changeOrderReason: [
    "change order reason",
    "motivo de la orden de cambio",
    "motivo"
  ],
  conditionsOfSatisfaction: [
    "conditions of satisfaction",
    "condiciones de satisfaccion",
    "condiciones de satisfacción"
  ],
  behaviorChanges: [
    "behavior changes",
    "behavior change",
    "cambios de comportamiento"
  ],
  erpIntegrationConditions: [
    "erp integration conditions",
    "erp integration conditons",
    "erp integration condition",
    "condiciones de integracion con el erp",
    "condiciones de integración con el erp"
  ],
  example: ["example", "ejemplo"]
};

const allKnownHeadings = Object.values(headingGroups)
  .flat()
  .map(normalizeForMatch);

const isHeading = (line: string, labels: string[]): boolean => {
  const normalizedLine = normalizeForMatch(line);

  return labels
    .map(normalizeForMatch)
    .some(label => normalizedLine === label);
};

const isAnyKnownHeading = (line: string): boolean =>
  allKnownHeadings.includes(normalizeForMatch(line));

const removeExampleBlocks = (lines: string[]): string[] => {
  const result: string[] = [];
  let isSkippingExampleBlock = false;

  lines.forEach(line => {
    if (isHeading(line, headingGroups.example)) {
      isSkippingExampleBlock = true;
      return;
    }

    if (isAnyKnownHeading(line)) {
      isSkippingExampleBlock = false;
    }

    if (!isSkippingExampleBlock) {
      result.push(line);
    }
  });

  return result;
};

const findHeadingIndex = (
  lines: string[],
  labels: string[],
  startIndex = 0
): number =>
  lines.findIndex((line, index) => index >= startIndex && isHeading(line, labels));

const getSectionLines = (
  lines: string[],
  startLabels: string[],
  endLabels: string[][]
): string[] => {
  const startIndex = findHeadingIndex(lines, startLabels);

  if (startIndex < 0) return [];

  const endIndexes = endLabels
    .map(labels => findHeadingIndex(lines, labels, startIndex + 1))
    .filter(index => index >= 0);

  const endIndex = endIndexes.length ? Math.min(...endIndexes) : lines.length;

  return lines.slice(startIndex + 1, endIndex);
};

const joinAsText = (lines: string[]): string =>
  lines
    .map(cleanLine)
    .filter(Boolean)
    .join("\n")
    .trim();

const joinAsParagraph = (lines: string[]): string =>
  lines
    .map(cleanLine)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const parseChangeOrderDocumentation = (text: string): Record<string, string> => {
  const lines = removeExampleBlocks(getLines(text));

  const titleLines = getSectionLines(lines, headingGroups.title, [
    headingGroups.description
  ]);

  const descriptionLines = getSectionLines(lines, headingGroups.description, [
    headingGroups.changeOrderReason,
    headingGroups.conditionsOfSatisfaction
  ]);

  const reasonLines = getSectionLines(lines, headingGroups.changeOrderReason, [
    headingGroups.conditionsOfSatisfaction
  ]);

  const conditionsLines = getSectionLines(
    lines,
    headingGroups.conditionsOfSatisfaction,
    []
  );

  const behaviorChangeLines = getSectionLines(
    conditionsLines,
    headingGroups.behaviorChanges,
    [headingGroups.erpIntegrationConditions]
  );

  const erpIntegrationLines = getSectionLines(
    conditionsLines,
    headingGroups.erpIntegrationConditions,
    []
  );

  return {
    titulo: joinAsParagraph(titleLines),
    descripcion: joinAsParagraph(descriptionLines),
    motivo: joinAsParagraph(reasonLines),
    cambios: joinAsText(behaviorChangeLines),
    integracion: joinAsText(erpIntegrationLines)
  };
};

const parseLabelValueText = (
  text: string,
  mappings: FieldMapping[]
): Record<string, string> => {
  const lines = getLines(text);

  return mappings.reduce<Record<string, string>>((acc, mapping) => {
    const foundLine = lines.find(line =>
      mapping.labels.some(label => {
        const normalizedLine = normalizeForMatch(line);
        const normalizedLabel = normalizeForMatch(label);

        return (
          normalizedLine.startsWith(`${normalizedLabel} `) ||
          normalizedLine.startsWith(`${normalizedLabel}:`)
        );
      })
    );

    if (!foundLine) return acc;

    const matchedLabel = mapping.labels.find(label =>
      normalizeForMatch(foundLine).startsWith(normalizeForMatch(label))
    );

    if (!matchedLabel) return acc;

    const value = foundLine
      .replace(new RegExp(`^${matchedLabel}\\s*[:：]?\\s*`, "i"), "")
      .trim();

    if (value) acc[mapping.key] = value;

    return acc;
  }, {});
};

export const parseStructuredText = (
  text: string,
  mappings: FieldMapping[]
): Record<string, string> => {
  const documentationData = parseChangeOrderDocumentation(text);
  const hasDocumentationData = Object.values(documentationData).some(Boolean);

  if (hasDocumentationData) {
    return documentationData;
  }

  return parseLabelValueText(text, mappings);
};

export const getMissingRequiredFields = (
  data: Record<string, string>,
  mappings: FieldMapping[]
): string[] =>
  mappings
    .filter(mapping => mapping.required)
    .filter(mapping => !data[mapping.key])
    .map(mapping => mapping.key);
