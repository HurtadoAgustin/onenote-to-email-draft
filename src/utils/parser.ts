import type {
  FieldMapping,
  OneNoteDomTextItem,
  ParsedListItem,
  TemplateData,
  TemplateValue
} from "./types";

type ParsedLine = {
  raw: string;
  text: string;
  normalized: string;
  level: number;
  isDivider?: boolean;
};

type MatchedDomHint = {
  item: ParsedListItem;
  hint?: OneNoteDomTextItem;
};

const LIST_LEVEL_TOLERANCE_PX = 18;
const listKeys = new Set([
  "cambios",
  "integracion",
  "technicalConditions",
  "additionalContext"
]);

const normalizeForMatch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:：]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeForDomLookup = (value: string): string =>
  stripLeadingBullet(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
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

const isDividerRawLine = (value: string): boolean =>
  /^\s*[-_—–]{5,}\s*$/.test(value);

const stripLeadingBullet = (value: string): string =>
  value
    .replace(/^\s*[•·▪▫◦○●■□‣⁃-]+\s*/, "")
    .replace(/^\s*[oO](?=\s|[A-ZÁÉÍÓÚÑ])\s*/, "");

const cleanText = (value: string): string =>
  stripLeadingBullet(value)
    .replace(/\s+/g, " ")
    .trim();

const parseLine = (rawLine: string): ParsedLine | null => {
  if (isDividerRawLine(rawLine)) {
    return {
      raw: rawLine,
      text: "-----",
      normalized: "section divider",
      level: 0,
      isDivider: true
    };
  }

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
  updateConsiderations: [
    "update considerations",
    "consideraciones de actualizacion",
    "consideraciones de actualización"
  ],
  designNotes: [
    "design notes",
    "notas de diseño"
  ],
  internalContext: [
    "internal context",
    "internal context not to be shared with customer",
    "contexto interno"
  ],
  estimationBreakdown: [
    "estimation breakdown",
    "desglose de estimacion",
    "desglose de estimación"
  ],
  responsibleOfEstimation: [
    "responsible of estimation",
    "responsable de estimacion",
    "responsable de estimación"
  ],
  acceptanceOfConditions: [
    "acceptance of conditions of satisfaction",
    "aceptacion de condiciones de satisfaccion",
    "aceptación de condiciones de satisfacción"
  ],
  responsibleOfDevelopment: [
    "responsible of development",
    "responsable de desarrollo"
  ],
  technicalConditions: [
    "technical conditions",
    "condiciones tecnicas",
    "condiciones técnicas"
  ],
  additionalContext: [
    "additional context",
    "contexto adicional"
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

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTicketToken = (value: string): string =>
  value.replace(/\s+/g, "").toUpperCase();

const parseTicketHeaderMetadata = (text: string): TemplateData => {
  const choNumberMatch = text.match(/\bCHO\s*-\s*\d{2,3}\b/i);
  const ticketNumberMatch = text.match(/\bT\s*-\s*\d+\b/i);

  return {
    choNumber: choNumberMatch ? normalizeTicketToken(choNumberMatch[0]) : "",
    ticketNumber: ticketNumberMatch ? normalizeTicketToken(ticketNumberMatch[0]) : ""
  };
};

const getInlineValueAfterLabel = (line: ParsedLine, labels: string[]): string => {
  const matchedLabel = labels.find(label =>
    line.normalized.startsWith(normalizeForMatch(label))
  );

  if (!matchedLabel) return "";

  return line.text
    .replace(new RegExp(`^${escapeRegExp(matchedLabel)}\\s*[:：-]?\\s*`, "i"), "")
    .trim();
};

const getOriginalRequestFieldValue = (
  lines: ParsedLine[],
  labels: string[]
): string => {
  const startIndex = findHeadingIndex(lines, labels);

  if (startIndex < 0) return "";

  const inlineValue = getInlineValueAfterLabel(lines[startIndex], labels);
  const isExactLabelLine = labels.some(
    label => lines[startIndex].normalized === normalizeForMatch(label)
  );

  if (inlineValue && !isExactLabelLine) return inlineValue;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const candidate = lines[index];

    if (isHeading(candidate, headingGroups.originalRequestTableFields)) return "";
    if (isAnyKnownHeading(candidate)) return "";
    if (candidate.text) return candidate.text;
  }

  return "";
};

const parseOriginalRequestMetadata = (lines: ParsedLine[]): TemplateData => ({
  clientChoRequester: getOriginalRequestFieldValue(lines, ["Full name"]),
  clientAndModule: getOriginalRequestFieldValue(lines, [
    "Client & module",
    "Client and module"
  ])
});

const parseTicketMetadata = (text: string, lines: ParsedLine[]): TemplateData => ({
  ...parseTicketHeaderMetadata(text),
  ...parseOriginalRequestMetadata(lines)
});

const findHeadingIndex = (
  lines: ParsedLine[],
  labels: string[],
  startIndex = 0
): number =>
  lines.findIndex((line, index) => index >= startIndex && isHeading(line, labels));

const isStopLine = (line: ParsedLine, endLabels: string[][]): boolean =>
  Boolean(line.isDivider) || endLabels.some(labels => isHeading(line, labels));

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
    headingGroups.updateConsiderations,
    headingGroups.designNotes,
    headingGroups.internalContext,
    headingGroups.estimationBreakdown,
    headingGroups.technicalConditions,
    headingGroups.additionalContext,
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
    headingGroups.updateConsiderations,
    headingGroups.designNotes,
    headingGroups.internalContext,
    headingGroups.estimationBreakdown,
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

  const designNotesSectionStops = [
    headingGroups.estimationBreakdown,
    headingGroups.responsibleOfEstimation,
    headingGroups.acceptanceOfConditions,
    headingGroups.responsibleOfDevelopment,
    headingGroups.keyCommunicationPoints,
    headingGroups.originalRequest,
    headingGroups.originalRequestTableFields,
    headingGroups.acceptanceMarkers,
    headingGroups.title,
    headingGroups.description,
    headingGroups.changeOrderReason,
    headingGroups.conditionsOfSatisfaction
  ];

  const designNotesLines = getSectionLines(
    lines,
    headingGroups.designNotes,
    designNotesSectionStops
  );

  const technicalConditionLines = getSectionLines(
    designNotesLines,
    headingGroups.technicalConditions,
    [
      headingGroups.additionalContext,
      ...designNotesSectionStops
    ]
  );

  const additionalContextLines = getSectionLines(
    designNotesLines,
    headingGroups.additionalContext,
    designNotesSectionStops
  );

  return {
    ...parseTicketMetadata(text, lines),
    titulo: joinAsParagraph(titleLines),
    descripcion: joinAsParagraph(descriptionLines),
    motivo: joinAsParagraph(reasonLines),
    cambios: normalizeListLevels(behaviorChangeLines),
    integracion: normalizeListLevels(erpIntegrationLines),
    technicalConditions: normalizeListLevels(technicalConditionLines),
    additionalContext: normalizeListLevels(additionalContextLines)
  };
};

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

const getDomHintScore = (
  item: ParsedListItem,
  hint: OneNoteDomTextItem,
  lastMatchedIndex: number
): number => {
  const itemText = normalizeForDomLookup(item.text);
  const hintText = normalizeForDomLookup(hint.text);
  const closestListText = normalizeForDomLookup(hint.closestListText);

  if (!itemText || !hintText) return Number.NEGATIVE_INFINITY;

  let score = Number.NEGATIVE_INFINITY;

  if (hintText === itemText) {
    score = 10000;
  } else if (closestListText === itemText) {
    score = 8000;
  } else if (closestListText.includes(itemText)) {
    score = 5000;
  } else if (itemText.includes(hintText) && hintText.length >= 20) {
    score = 2000;
  }

  if (!Number.isFinite(score)) return score;

  if (hint.index > lastMatchedIndex) score += 500;
  if (hint.className.includes("NormalTextRun")) score += 80;
  if (hint.className.includes("TextRun")) score += 40;

  score -= Math.abs(hintText.length - itemText.length);

  return score;
};

const findBestSequentialDomHints = (
  items: ParsedListItem[],
  domTextItems: OneNoteDomTextItem[]
): MatchedDomHint[] => {
  let lastMatchedIndex = -1;

  return items.map(item => {
    const candidates = domTextItems
      .map(hint => ({
        hint,
        score: getDomHintScore(item, hint, lastMatchedIndex)
      }))
      .filter(candidate => Number.isFinite(candidate.score))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.hint.index - b.hint.index;
      });

    const bestFutureCandidate = candidates.find(
      candidate => candidate.hint.index > lastMatchedIndex
    );
    const bestCandidate = bestFutureCandidate ?? candidates[0];

    if (!bestCandidate) {
      return { item };
    }

    lastMatchedIndex = bestCandidate.hint.index;

    return {
      item,
      hint: bestCandidate.hint
    };
  });
};

const getNumericLevelSource = (hint: OneNoteDomTextItem): number => {
  if (Number.isFinite(hint.rectLeft) && hint.rectLeft > 0) {
    return hint.rectLeft;
  }

  if (Number.isFinite(hint.listItemRectLeft) && hint.listItemRectLeft > 0) {
    return hint.listItemRectLeft;
  }

  if (Number.isFinite(hint.computedLevelHint) && hint.computedLevelHint > 0) {
    return hint.computedLevelHint;
  }

  return 0;
};

const buildLevelGroups = (matchedHints: MatchedDomHint[]): number[] => {
  const rawLevelSources = matchedHints
    .map(matchedHint => matchedHint.hint)
    .filter((hint): hint is OneNoteDomTextItem => Boolean(hint))
    .map(getNumericLevelSource)
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  return rawLevelSources.reduce<number[]>((groups, value) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup === undefined || Math.abs(value - lastGroup) > LIST_LEVEL_TOLERANCE_PX) {
      groups.push(value);
    }

    return groups;
  }, []);
};

const getGroupedLevel = (value: number, groups: number[]): number => {
  if (!groups.length || !Number.isFinite(value) || value <= 0) return 0;

  const nearestIndex = groups.reduce(
    (bestIndex, groupValue, index) => {
      const bestDistance = Math.abs(value - groups[bestIndex]);
      const currentDistance = Math.abs(value - groupValue);

      return currentDistance < bestDistance ? index : bestIndex;
    },
    0
  );

  return Math.max(0, nearestIndex);
};

const applyDomLevelsToList = (
  items: ParsedListItem[],
  domTextItems: OneNoteDomTextItem[]
): ParsedListItem[] => {
  if (!items.length || !domTextItems.length) return items;

  const matchedHints = findBestSequentialDomHints(items, domTextItems);
  const levelGroups = buildLevelGroups(matchedHints);

  return matchedHints.map(({ item, hint }) => {
    if (!hint) return item;

    return {
      ...item,
      level: getGroupedLevel(getNumericLevelSource(hint), levelGroups)
    };
  });
};

export const applyDomListLevelHints = (
  data: TemplateData,
  domTextItems: OneNoteDomTextItem[] = []
): TemplateData => {
  if (!domTextItems.length) return data;

  return Object.entries(data).reduce<TemplateData>((acc, [key, value]) => {
    if (!listKeys.has(key) || !Array.isArray(value)) {
      acc[key] = value;
      return acc;
    }

    acc[key] = applyDomLevelsToList(value, domTextItems);
    return acc;
  }, {});
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

  return {
    ...parseTicketMetadata(text, getLines(text)),
    ...parseLabelValueText(text, mappings)
  };
};

export const getMissingRequiredFields = (
  data: TemplateData,
  mappings: FieldMapping[]
): string[] =>
  mappings
    .filter(mapping => mapping.required)
    .filter(mapping => isEmptyValue(data[mapping.key]))
    .map(mapping => mapping.key);
