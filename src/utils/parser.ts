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
    .replace(/^[•·▪▫◦‣⁃-]\s+/, "")
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
    "condiciones de integracion con el erp",
    "condiciones de integración con el erp"
  ],
  keyCommunicationPoints: [
    "key communication points",
    "puntos clave de comunicacion",
    "puntos clave de comunicación"
  ],
  originalRequest: [
    "original request",
    "solicitud original",
    "pedido original",
    "requerimiento original"
  ],
  originalRequestTableFields: [
    "full name",
    "role",
    "original email/file with request",
    "client & module",
    "client and module",
    "original helpdesk ticket (sh/hd)",
    "original helpdesk ticket sh/hd"
  ],
  acceptanceMarkers: [
    "acceptance of functionality attached",
    "acceptance of functionality in qa",
    "completed in qa",
    "em file"
  ],
  example: ["example", "ejemplo"]
};

const allKnownHeadings = Object.values(headingGroups)
  .flat()
  .map(normalizeForMatch);

const isSameOrStartsWithHeading = (line: string, label: string): boolean => {
  const normalizedLine = normalizeForMatch(line);
  const normalizedLabel = normalizeForMatch(label);

  return (
    normalizedLine === normalizedLabel ||
    normalizedLine.startsWith(`${normalizedLabel} `)
  );
};

const isHeading = (line: string, labels: string[]): boolean =>
  labels.some(label => isSameOrStartsWithHeading(line, label));

const isAnyKnownHeading = (line: string): boolean => {
  const normalizedLine = normalizeForMatch(line);

  return allKnownHeadings.some(
    heading => normalizedLine === heading || normalizedLine.startsWith(`${heading} `)
  );
};

const isBulletOnlyLine = (line: string): boolean =>
  /^[oO○◦●•·▪▫‣⁃-]$/.test(line.trim());

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

const isStopLine = (line: string, endLabels: string[][]): boolean =>
  endLabels.some(labels => isHeading(line, labels));

const getSectionLines = (
  lines: string[],
  startLabels: string[],
  endLabels: string[][]
): string[] => {
  const startIndex = findHeadingIndex(lines, startLabels);

  if (startIndex < 0) return [];

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && isStopLine(line, endLabels)
  );

  return lines.slice(startIndex + 1, endIndex >= 0 ? endIndex : lines.length);
};

const trimAtFirstStopLine = (
  lines: string[],
  stopLabels: string[][]
): string[] => {
  const stopIndex = lines.findIndex(line => isStopLine(line, stopLabels));

  return stopIndex >= 0 ? lines.slice(0, stopIndex) : lines;
};

const removeEmptyVisualItems = (lines: string[]): string[] =>
  lines.filter(line => !isBulletOnlyLine(line));

const sanitizeErpIntegrationLines = (lines: string[]): string[] => {
  const strictStopLabels = [
    headingGroups.keyCommunicationPoints,
    headingGroups.originalRequest,
    headingGroups.originalRequestTableFields,
    headingGroups.acceptanceMarkers,
    headingGroups.title,
    headingGroups.description,
    headingGroups.changeOrderReason,
    headingGroups.conditionsOfSatisfaction,
    headingGroups.behaviorChanges
  ];

  return removeEmptyVisualItems(trimAtFirstStopLine(lines, strictStopLabels));
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

  const sectionAfterConditionsStops = [
    headingGroups.keyCommunicationPoints,
    headingGroups.originalRequest,
    headingGroups.originalRequestTableFields,
    headingGroups.acceptanceMarkers
  ];

  const titleLines = getSectionLines(lines, headingGroups.title, [
    headingGroups.description,
    headingGroups.changeOrderReason,
    headingGroups.conditionsOfSatisfaction,
    ...sectionAfterConditionsStops
  ]);

  const descriptionLines = getSectionLines(lines, headingGroups.description, [
    headingGroups.changeOrderReason,
    headingGroups.conditionsOfSatisfaction,
    ...sectionAfterConditionsStops
  ]);

  const reasonLines = getSectionLines(lines, headingGroups.changeOrderReason, [
    headingGroups.conditionsOfSatisfaction,
    ...sectionAfterConditionsStops
  ]);

  const conditionsLines = getSectionLines(
    lines,
    headingGroups.conditionsOfSatisfaction,
    sectionAfterConditionsStops
  );

  const behaviorChangeLines = getSectionLines(
    conditionsLines,
    headingGroups.behaviorChanges,
    [
      headingGroups.erpIntegrationConditions,
      ...sectionAfterConditionsStops
    ]
  );

  const erpIntegrationLines = sanitizeErpIntegrationLines(
    getSectionLines(
      conditionsLines,
      headingGroups.erpIntegrationConditions,
      sectionAfterConditionsStops
    )
  );

  return {
    titulo: joinAsParagraph(titleLines),
    descripcion: joinAsParagraph(descriptionLines),
    motivo: joinAsParagraph(reasonLines),
    cambios: joinAsText(removeEmptyVisualItems(behaviorChangeLines)),
    integracion: joinAsText(erpIntegrationLines)
  };
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseLabelValueText = (
  text: string,
  mappings: FieldMapping[]
): Record<string, string> => {
  const lines = getLines(text);

  return mappings.reduce<Record<string, string>>((acc, mapping) => {
    const foundLine = lines.find(line =>
      mapping.labels.some(label =>
        normalizeForMatch(line).startsWith(`${normalizeForMatch(label)} `) ||
        normalizeForMatch(line).startsWith(`${normalizeForMatch(label)}:`)
      )
    );

    if (!foundLine) return acc;

    const matchedLabel = mapping.labels.find(label =>
      normalizeForMatch(foundLine).startsWith(normalizeForMatch(label))
    );

    if (!matchedLabel) return acc;

    const value = foundLine
      .replace(new RegExp(`^${escapeRegExp(matchedLabel)}\\s*[:：]?\\s*`, "i"), "")
      .trim();

    acc[mapping.key] = value;

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
