import type { FieldMapping, ParsedListItem, TemplateData, TemplateValue } from "./types";

type ParsedLine = {
  raw: string;
  text: string;
  normalized: string;
  level: number;
};

const normalizeForMatch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:：]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getLeadingWhitespaceCount = (value: string): number => {
  const leadingWhitespace = value.match(/^[\t ]*/)?.[0] ?? "";

  return Array.from(leadingWhitespace).reduce(
    (count, character) => count + (character === "\t" ? 4 : 1),
    0
  );
};

const getBulletSymbol = (value: string): string => {
  const trimmed = value.trimStart();
  const symbolMatch = trimmed.match(/^([•·▪▫◦○●■□‣⁃-])/);

  if (symbolMatch) return symbolMatch[1];

  const letterBulletMatch = trimmed.match(/^([oO])(?=\s|[A-ZÁÉÍÓÚÑ])/);

  return letterBulletMatch?.[1] ?? "";
};

const getLineDepth = (value: string): number => {
  const leadingWhitespaceCount = getLeadingWhitespaceCount(value);
  const bulletSymbol = getBulletSymbol(value);

  if (["▪", "▫", "■", "□", "‣", "⁃"].includes(bulletSymbol)) {
    return 1;
  }

  if (bulletSymbol && leadingWhitespaceCount >= 4) {
    return 1;
  }

  if (!bulletSymbol && leadingWhitespaceCount >= 4) {
    return 1;
  }

  return 0;
};

const stripLeadingBullet = (value: string): string =>
  value
    .replace(/^\s*[•·▪▫◦○●■□‣⁃-]+\s*/, "")
    .replace(/^\s*[oO](?=\s|[A-ZÁÉÍÓÚÑ])\s*/, "");

const cleanText = (value: string): string =>
  stripLeadingBullet(value)
    .replace(/\s+/g, " ")
    .trim();

const parseLine = (rawLine: string): ParsedLine | null => {
  const text = cleanText(rawLine);

  if (!text) return null;

  const level = getLineDepth(rawLine);

  return {
    raw: rawLine,
    text,
    normalized: normalizeForMatch(text),
    level
  };
};

const getLines = (text: string): ParsedLine[] =>
  text
    .replace(/\r/g, "\n")
    .split("\n")
    .map(parseLine)
    .filter((line): line is ParsedLine => Boolean(line));

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

const isSameOrStartsWithHeading = (line: ParsedLine, label: string): boolean => {
  const normalizedLabel = normalizeForMatch(label);

  return (
    line.normalized === normalizedLabel ||
    line.normalized.startsWith(`${normalizedLabel} `)
  );
};

const isHeading = (line: ParsedLine, labels: string[]): boolean =>
  labels.some(label => isSameOrStartsWithHeading(line, label));

const isAnyKnownHeading = (line: ParsedLine): boolean =>
  allKnownHeadings.some(
    heading => line.normalized === heading || line.normalized.startsWith(`${heading} `)
  );

const isBulletOnlyLine = (line: ParsedLine): boolean =>
  /^[oO○◦●•·▪▫■□‣⁃-]$/.test(line.text.trim());

const removeExampleBlocks = (lines: ParsedLine[]): ParsedLine[] => {
  const result: ParsedLine[] = [];
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
  lines: ParsedLine[],
  labels: string[],
  startIndex = 0
): number =>
  lines.findIndex((line, index) => index >= startIndex && isHeading(line, labels));

const isStopLine = (line: ParsedLine, endLabels: string[][]): boolean =>
  endLabels.some(labels => isHeading(line, labels));

const getSectionLines = (
  lines: ParsedLine[],
  startLabels: string[],
  endLabels: string[][]
): ParsedLine[] => {
  const startIndex = findHeadingIndex(lines, startLabels);

  if (startIndex < 0) return [];

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && isStopLine(line, endLabels)
  );

  return lines.slice(startIndex + 1, endIndex >= 0 ? endIndex : lines.length);
};

const trimAtFirstStopLine = (
  lines: ParsedLine[],
  stopLabels: string[][]
): ParsedLine[] => {
  const stopIndex = lines.findIndex(line => isStopLine(line, stopLabels));

  return stopIndex >= 0 ? lines.slice(0, stopIndex) : lines;
};

const removeEmptyVisualItems = (lines: ParsedLine[]): ParsedLine[] =>
  lines.filter(line => !isBulletOnlyLine(line));

const sanitizeErpIntegrationLines = (lines: ParsedLine[]): ParsedLine[] => {
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

const normalizeListLevels = (lines: ParsedLine[]): ParsedListItem[] => {
  const filteredLines = removeEmptyVisualItems(lines).filter(
    line => line.text && !isAnyKnownHeading(line)
  );

  const minLevel = filteredLines.length
    ? Math.min(...filteredLines.map(line => line.level))
    : 0;

  return filteredLines.map(line => ({
    text: line.text,
    level: Math.max(0, line.level - minLevel)
  }));
};

const joinAsParagraph = (lines: ParsedLine[]): string =>
  lines
    .map(line => line.text)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const parseChangeOrderDocumentation = (text: string): TemplateData => {
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
    cambios: normalizeListLevels(behaviorChangeLines),
    integracion: normalizeListLevels(erpIntegrationLines)
  };
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseLabelValueText = (
  text: string,
  mappings: FieldMapping[]
): TemplateData => {
  const lines = getLines(text);

  return mappings.reduce<TemplateData>((acc, mapping) => {
    const foundLine = lines.find(line =>
      mapping.labels.some(label => {
        const normalizedLabel = normalizeForMatch(label);
        return (
          line.normalized.startsWith(`${normalizedLabel} `) ||
          line.normalized.startsWith(`${normalizedLabel}:`)
        );
      })
    );

    if (!foundLine) return acc;

    const matchedLabel = mapping.labels.find(label =>
      foundLine.normalized.startsWith(normalizeForMatch(label))
    );

    if (!matchedLabel) return acc;

    const value = foundLine.text
      .replace(new RegExp(`^${escapeRegExp(matchedLabel)}\\s*[:：]?\\s*`, "i"), "")
      .trim();

    acc[mapping.key] = value;

    return acc;
  }, {});
};

const isEmptyValue = (value: TemplateValue | undefined): boolean => {
  if (Array.isArray(value)) return value.length === 0;
  return !value?.trim();
};

export const parseStructuredText = (
  text: string,
  mappings: FieldMapping[]
): TemplateData => {
  const documentationData = parseChangeOrderDocumentation(text);
  const hasDocumentationData = Object.values(documentationData).some(
    value => !isEmptyValue(value)
  );

  if (hasDocumentationData) {
    return documentationData;
  }

  return parseLabelValueText(text, mappings);
};

export const getMissingRequiredFields = (
  data: TemplateData,
  mappings: FieldMapping[]
): string[] =>
  mappings
    .filter(mapping => mapping.required)
    .filter(mapping => isEmptyValue(data[mapping.key]))
    .map(mapping => mapping.key);
