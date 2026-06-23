// src/templates/docs/changeOrderDocumentation.ts
var changeOrderDocumentationProfile = {
  id: "changeOrder",
  listFieldKeys: [
    "cambios",
    "integracion",
    "updateConsiderations",
    "technicalConditions",
    "additionalContext"
  ],
  sectionHeadings: {
    definitionOfDone: [
      "Definition of 'Done'",
      "Definition of Done",
      "Definici\xF3n de Terminado",
      "Definicion de Terminado"
    ],
    keyCommunicationPoints: [
      "Key communication points",
      "Puntos clave de comunicaci\xF3n",
      "Puntos clave de comunicacion"
    ],
    originalRequest: [
      "Original Request",
      "Solicitud original",
      "Pedido original",
      "Requerimiento original"
    ],
    originalRequestTableFields: [
      "Full name",
      "Role",
      "Original email/file with request",
      "Client & module",
      "Client and module",
      "Original HelpDesk Ticket (SH/HD)",
      "Original HelpDesk Ticket SH/HD"
    ],
    title: [
      "Title",
      "T\xEDtulo",
      "Titulo"
    ],
    description: [
      "Description",
      "Descripci\xF3n",
      "Descripcion"
    ],
    changeOrderReason: [
      "Change Order Reason",
      "Motivo de la Orden de Cambio",
      "Motivo"
    ],
    conditionsOfSatisfaction: [
      "Conditions of Satisfaction",
      "Condiciones de satisfacci\xF3n",
      "Condiciones de satisfaccion"
    ],
    behaviorChanges: [
      "Behavior changes",
      "Behavior change",
      "Cambios de comportamiento"
    ],
    erpIntegrationConditions: [
      "ERP Integration Conditions",
      "ERP Integration Conditons",
      "Condiciones de Integraci\xF3n con el ERP",
      "Condiciones de Integracion con el ERP"
    ],
    updateConsiderations: [
      "Update Considerations",
      "Update Consideration",
      "Consideraciones para Updates",
      "Consideraciones para Update",
      "Consideraciones de Updates",
      "Consideraciones de Update",
      "Consideraciones de Actualizaci\xF3n",
      "Consideraciones de Actualizacion",
      "Consideraciones por actualizaci\xF3n",
      "Consideraciones por actualizacion"
    ],
    designNotes: [
      "Design notes",
      "Notas de dise\xF1o"
    ],
    technicalConditions: [
      "Technical Conditions",
      "Condiciones T\xE9cnicas",
      "Condiciones Tecnicas"
    ],
    additionalContext: [
      "Additional context",
      "Contexto adicional"
    ],
    responsibleOfEstimation: [
      "Responsible of estimation",
      "Responsable de estimaci\xF3n",
      "Responsable de estimacion"
    ],
    acceptanceOfConditions: [
      "Acceptance of conditions of satisfaction",
      "Aceptaci\xF3n de condiciones de satisfacci\xF3n",
      "Aceptacion de condiciones de satisfaccion"
    ],
    responsibleOfDevelopment: [
      "Responsible of development",
      "Responsable de desarrollo"
    ],
    implementationComponentsModified: [
      "Implementation/Components modified",
      "Implementation Components modified",
      "Componentes modificados",
      "Implementaci\xF3n/Componentes modificados",
      "Implementacion/Componentes modificados"
    ],
    layoutModifications: [
      "Layout Modifications",
      "Modificaciones de layout",
      "Modificaciones del layout"
    ],
    upgradabilityNotes: [
      "Upgradability notes",
      "Notas de actualizaci\xF3n",
      "Notas de actualizacion",
      "Notas de upgradability"
    ],
    upgradabilityTableFields: [
      "Number of Hooks",
      "Script/Library (where it is called)",
      "Function (called - full namespace)",
      "Additional Modified Component",
      "Modification Description"
    ],
    changelogs: [
      "Changelogs (EOD Configuration changes)",
      "Changelogs",
      "EOD Configuration changes",
      "Cambios de configuraci\xF3n EOD",
      "Cambios de configuracion EOD"
    ],
    additionalDevelopmentNotes: [
      "Additional Development Notes",
      "Notas adicionales de desarrollo"
    ],
    developerTests: [
      "Developer tests",
      "Pruebas de desarrollador"
    ],
    nonDeveloperTests: [
      "Non-developer tests",
      "Non developer tests",
      "Pruebas de no desarrollador"
    ],
    keyEmailCommunication: [
      "Key email communication",
      "Comunicaci\xF3n clave por email",
      "Comunicacion clave por email"
    ],
    updates: [
      "Updates",
      "Actualizaciones"
    ],
    internalContext: [
      "Internal context",
      "Internal context not to be shared with customer",
      "Contexto interno"
    ],
    estimationBreakdown: [
      "Estimation breakdown",
      "Desglose de estimaci\xF3n",
      "Desglose de estimacion"
    ],
    acceptanceMarkers: [
      "Acceptance of functionality attached",
      "Acceptance of functionality in QA",
      "Completed in QA",
      "EML file",
      "Email Example"
    ]
  }
};

// src/templateRegistry/sharedFieldMappings.ts
var changeOrderMetadataFieldMappings = [
  {
    key: "choNumber",
    labels: ["CHO Number"]
  },
  {
    key: "ticketNumber",
    labels: ["Ticket Number"]
  },
  {
    key: "clientAndModule",
    labels: ["Client & module", "Client and module"]
  },
  {
    key: "clientChoRequester",
    labels: ["Full name"]
  },
  {
    key: "templateType",
    labels: ["Template Type"]
  }
];
var changeOrderContentFieldMappings = [
  {
    key: "titulo",
    labels: ["Title", "T\xEDtulo", "Titulo"],
    required: true
  },
  {
    key: "motivo",
    labels: ["Change Order Reason", "Motivo de la Orden de Cambio"],
    required: true
  },
  {
    key: "descripcion",
    labels: ["Description", "Descripci\xF3n", "Descripcion"],
    required: true
  },
  {
    key: "cambios",
    labels: ["Behavior changes", "Cambios de comportamiento"],
    required: true
  },
  {
    key: "integracion",
    labels: [
      "ERP Integration Conditions",
      "ERP Integration Conditons",
      "Condiciones de Integraci\xF3n con el ERP",
      "Condiciones de Integracion con el ERP"
    ],
    required: false
  },
  {
    key: "updateConsiderations",
    labels: [
      "Update Considerations",
      "Consideraciones para Updates",
      "Consideraciones para Update",
      "Consideraciones de Updates",
      "Consideraciones de Update",
      "Consideraciones de Actualizaci\xF3n",
      "Consideraciones de Actualizacion",
      "Consideraciones por actualizaci\xF3n",
      "Consideraciones por actualizacion"
    ],
    required: false
  },
  {
    key: "technicalConditions",
    labels: [
      "Technical Conditions",
      "Condiciones T\xE9cnicas",
      "Condiciones Tecnicas"
    ],
    required: false
  },
  {
    key: "additionalContext",
    labels: [
      "Additional context",
      "Contexto adicional"
    ],
    required: false
  }
];
var changeOrderFieldMappings = [
  ...changeOrderMetadataFieldMappings,
  ...changeOrderContentFieldMappings
];

// src/templates/mails/estimation.ts
var estimationTemplate = {
  id: "estimation",
  label: "Estimaci\xF3n",
  description: "Sends the estimation email for a ticket.",
  subjectTemplate: "[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Buenos d\xEDas{{technicalArchitect}},</p>

  <p>Te env\xEDo la estimaci\xF3n correspondiente al ticket <a href="{{ticketUrl}}" target="_blank" style="color: #1b77c5; text-decoration: underline;">{{ticketNumber}}</a>. La misma deber\xE1 ser enviada a {{clientChoRequester}}.</p>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">T\xEDtulo</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Motivo de la Orden de Cambio</h2>
  <ul>
    <li>{{motivo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Descripci\xF3n</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Condiciones de satisfacci\xF3n</h2>

  <p style="margin: 10px 0 4px 36px;"><strong>Cambios de comportamiento</strong></p>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <p style="margin: 10px 0 4px 36px;"><strong>Condiciones de Integraci\xF3n con el ERP</strong></p>
  <ul style="margin-left: 36px;">
    {{integracion}}
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Consideraciones para Updates</h2>
  {{updateConsiderations}}

  <p style="margin: 28px 0 28px 0; color: #1f4e79; font-family: monospace;">------------------------------------------------------------</p>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 700; margin: 18px 0 8px 0;">Internal context (not to be shared with customer)</h2>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Design notes</h2>

  <p style="margin: 10px 0 4px 36px;"><strong>Technical Conditions</strong></p>
  <ul style="margin-left: 36px;">
    {{technicalConditions}}
  </ul>

  <p style="margin: 10px 0 4px 36px;"><strong>Additional context</strong></p>
  <ul style="margin-left: 36px;">
    {{additionalContext}}
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Estimation breakdown</h2>

  {{estimationBreakdownTable}}

  <p>Quedo atento a cualquier comentario o sugerencia.<br />Saludos.</p>
</div>
  `,
  fieldMappings: changeOrderFieldMappings,
  documentationProfile: changeOrderDocumentationProfile
};

// src/utils/config.ts
var defaultConfig = {
  mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
  technicalArchitect: "",
  emptyFieldFallback: "",
  ticketUrlTemplate: "https://request-sa2.odoo.com/web#id={{ticketNumber}}&menu_id=87&cids=1&action=140&model=project.task&view_type=form",
  templateOverrides: {},
  selectors: {
    oneNoteRoot: "",
    gmailComposeDialog: "div[role='dialog']",
    gmailSubject: "input[name='subjectbox']",
    gmailBody: "div[aria-label='Message Body'], div[role='textbox'][aria-label]"
  },
  flags: {
    allowIncompleteFields: true
  }
};

// src/utils/parser.ts
var headingGroups = changeOrderDocumentationProfile.sectionHeadings;
var allHeadingLabelGroups = Object.values(headingGroups);
var normalizeForMatch = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[:：]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
var getLeadingWhitespaceCount = (value) => {
  const leadingWhitespace = value.match(/^[\t ]*/)?.[0] ?? "";
  return Array.from(leadingWhitespace).reduce(
    (count, character) => count + (character === "	" ? 4 : 1),
    0
  );
};
var getBulletSymbol = (value) => {
  const trimmed = value.trimStart();
  const symbolMatch = trimmed.match(/^([•·▪▫◦○●■□‣⁃-])/);
  if (symbolMatch) return symbolMatch[1];
  const letterBulletMatch = trimmed.match(/^([oO])(?=\s|[A-ZÁÉÍÓÚÑ])/);
  return letterBulletMatch?.[1] ?? "";
};
var getLineDepth = (value) => {
  const leadingWhitespaceCount = getLeadingWhitespaceCount(value);
  const bulletSymbol = getBulletSymbol(value);
  if (["\u25AA", "\u25AB", "\u25A0", "\u25A1", "\u2023", "\u2043"].includes(bulletSymbol)) {
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
var isDividerRawLine = (value) => /^\s*[-_—–]{5,}\s*$/.test(value);
var isStandaloneDashContent = (value) => /^[-–—]$/.test(value.trim());
var stripLeadingBullet = (value) => {
  if (isStandaloneDashContent(value)) return value.trim();
  return value.replace(/^\s*[•·▪▫◦○●■□‣⁃-]+\s*/, "").replace(/^\s*[oO](?=\s|[A-ZÁÉÍÓÚÑ])\s*/, "");
};
var cleanText = (value) => stripLeadingBullet(value).replace(/\s+/g, " ").trim();
var parseLine = (rawLine) => {
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
var getLines = (text) => text.replace(/\r/g, "\n").split("\n").map(parseLine).filter((line) => Boolean(line));
var allKnownHeadings = allHeadingLabelGroups.flat().map(normalizeForMatch);
var getAllHeadingGroupsExcept = (excludedKeys = []) => Object.entries(headingGroups).filter(([key]) => !excludedKeys.includes(key)).map(([, labels]) => labels);
var isSameOrStartsWithHeading = (line, label) => {
  const normalizedLabel = normalizeForMatch(label);
  return line.normalized === normalizedLabel || line.normalized.startsWith(`${normalizedLabel} `);
};
var isHeading = (line, labels) => labels.some((label) => isSameOrStartsWithHeading(line, label));
var isAnyKnownHeading = (line) => allKnownHeadings.some(
  (heading) => line.normalized === heading || line.normalized.startsWith(`${heading} `)
);
var isBulletOnlyLine = (line) => /^[oO○◦●•·▪▫■□‣⁃]$/.test(line.text.trim());
var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var normalizeTicketToken = (value) => value.replace(/\s+/g, "").toUpperCase();
var parseTicketHeaderMetadata = (text) => {
  const choNumberMatch = text.match(/\bCHO\s*-\s*\d{2,3}\b/i);
  const ticketNumberMatch = text.match(/\bT\s*-\s*\d+\b/i);
  return {
    choNumber: choNumberMatch ? normalizeTicketToken(choNumberMatch[0]) : "",
    ticketNumber: ticketNumberMatch ? normalizeTicketToken(ticketNumberMatch[0]) : ""
  };
};
var getInlineValueAfterLabel = (line, labels) => {
  const matchedLabel = labels.find(
    (label) => line.normalized.startsWith(normalizeForMatch(label))
  );
  if (!matchedLabel) return "";
  return line.text.replace(new RegExp(`^${escapeRegExp(matchedLabel)}\\s*[:\uFF1A-]?\\s*`, "i"), "").trim();
};
var getOriginalRequestFieldValue = (lines, labels) => {
  const startIndex = findHeadingIndex(lines, labels);
  if (startIndex < 0) return "";
  const inlineValue = getInlineValueAfterLabel(lines[startIndex], labels);
  const isExactLabelLine = labels.some(
    (label) => lines[startIndex].normalized === normalizeForMatch(label)
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
var parseOriginalRequestMetadata = (lines) => ({
  clientChoRequester: getOriginalRequestFieldValue(lines, ["Full name"]),
  clientAndModule: getOriginalRequestFieldValue(lines, [
    "Client & module",
    "Client and module"
  ])
});
var parseTicketMetadata = (text, lines) => ({
  ...parseTicketHeaderMetadata(text),
  ...parseOriginalRequestMetadata(lines)
});
var findHeadingIndex = (lines, labels, startIndex = 0) => lines.findIndex((line, index) => index >= startIndex && isHeading(line, labels));
var isStopLine = (line, endLabels) => Boolean(line.isDivider) || endLabels.some((labels) => isHeading(line, labels));
var getSectionLines = (lines, startLabels, endLabels) => {
  const startIndex = findHeadingIndex(lines, startLabels);
  if (startIndex < 0) return [];
  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && isStopLine(line, endLabels)
  );
  return lines.slice(startIndex + 1, endIndex >= 0 ? endIndex : lines.length);
};
var trimAtFirstStopLine = (lines, stopLabels) => {
  const stopIndex = lines.findIndex((line) => isStopLine(line, stopLabels));
  return stopIndex >= 0 ? lines.slice(0, stopIndex) : lines;
};
var removeEmptyVisualItems = (lines) => lines.filter((line) => !isBulletOnlyLine(line));
var sanitizeErpIntegrationLines = (lines) => {
  const strictStopLabels = getAllHeadingGroupsExcept();
  return removeEmptyVisualItems(trimAtFirstStopLine(lines, strictStopLabels));
};
var normalizeListLevels = (lines) => {
  const filteredLines = removeEmptyVisualItems(lines).filter(
    (line) => line.text && !isAnyKnownHeading(line)
  );
  const minLevel = filteredLines.length ? Math.min(...filteredLines.map((line) => line.level)) : 0;
  return filteredLines.map((line) => ({
    text: line.text,
    level: Math.max(0, line.level - minLevel)
  }));
};
var joinAsParagraph = (lines) => lines.map((line) => line.text).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
var parseChangeOrderDocumentation = (text) => {
  const lines = getLines(text);
  const allContentSectionStops = getAllHeadingGroupsExcept();
  const conditionChildSectionKeys = [
    "behaviorChanges",
    "erpIntegrationConditions",
    "updateConsiderations"
  ];
  const conditionsEndStops = getAllHeadingGroupsExcept([
    ...conditionChildSectionKeys
  ]);
  const titleLines = getSectionLines(lines, headingGroups.title, [
    ...allContentSectionStops
  ]);
  const descriptionLines = getSectionLines(lines, headingGroups.description, [
    ...allContentSectionStops
  ]);
  const reasonLines = getSectionLines(lines, headingGroups.changeOrderReason, [
    ...allContentSectionStops
  ]);
  const conditionsLines = getSectionLines(
    lines,
    headingGroups.conditionsOfSatisfaction,
    conditionsEndStops
  );
  const behaviorChangeLines = getSectionLines(
    conditionsLines,
    headingGroups.behaviorChanges,
    allContentSectionStops
  );
  const erpIntegrationLines = sanitizeErpIntegrationLines(
    getSectionLines(
      conditionsLines,
      headingGroups.erpIntegrationConditions,
      allContentSectionStops
    )
  );
  const updateConsiderationLines = getSectionLines(
    conditionsLines,
    headingGroups.updateConsiderations,
    allContentSectionStops
  );
  const designNotesSectionStops = getAllHeadingGroupsExcept([
    "technicalConditions",
    "additionalContext"
  ]);
  const designNotesLines = getSectionLines(
    lines,
    headingGroups.designNotes,
    designNotesSectionStops
  );
  const technicalConditionLines = getSectionLines(
    designNotesLines,
    headingGroups.technicalConditions,
    allContentSectionStops
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
    updateConsiderations: normalizeListLevels(updateConsiderationLines),
    technicalConditions: normalizeListLevels(technicalConditionLines),
    additionalContext: normalizeListLevels(additionalContextLines)
  };
};
var parseLabelValueText = (text, mappings) => {
  const lines = getLines(text);
  return mappings.reduce((acc, mapping) => {
    const foundLine = lines.find(
      (line) => mapping.labels.some((label) => {
        const normalizedLabel = normalizeForMatch(label);
        return line.normalized.startsWith(`${normalizedLabel} `) || line.normalized.startsWith(`${normalizedLabel}:`);
      })
    );
    if (!foundLine) return acc;
    const matchedLabel = mapping.labels.find(
      (label) => foundLine.normalized.startsWith(normalizeForMatch(label))
    );
    if (!matchedLabel) return acc;
    const value = foundLine.text.replace(new RegExp(`^${escapeRegExp(matchedLabel)}\\s*[:\uFF1A]?\\s*`, "i"), "").trim();
    acc[mapping.key] = value;
    return acc;
  }, {});
};
var isEmptyValue = (value) => {
  if (Array.isArray(value)) return value.length === 0;
  return !value?.trim();
};
var parseStructuredText = (text, mappings, documentationProfile = changeOrderDocumentationProfile) => {
  const documentationData = documentationProfile.id === "changeOrder" ? parseChangeOrderDocumentation(text) : {};
  const hasDocumentationData = Object.values(documentationData).some(
    (value) => !isEmptyValue(value)
  );
  if (hasDocumentationData) {
    return documentationData;
  }
  return {
    ...parseTicketMetadata(text, getLines(text)),
    ...parseLabelValueText(text, mappings)
  };
};

// src/utils/template.ts
var escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
var htmlKeys = /* @__PURE__ */ new Set([
  "estimationBreakdownTable"
]);
var listItemKeys = /* @__PURE__ */ new Set([
  "cambios",
  "integracion",
  "technicalConditions",
  "additionalContext"
]);
var getStringLineLevel = (line) => line.match(/^\t*/)?.[0].length ?? 0;
var parseStringAsListItems = (value) => value.split("\n").map((line) => ({
  text: line.replace(/^\t+/, "").trim(),
  level: getStringLineLevel(line)
})).filter((item) => item.text);
var normalizeValueToListItems = (value) => {
  if (Array.isArray(value)) return value;
  return parseStringAsListItems(value);
};
var buildNestedList = (items) => {
  const root = [];
  const stack = [];
  items.filter((item) => item.text.trim()).forEach((item) => {
    const level = Math.max(0, item.level);
    const node = {
      text: item.text.trim(),
      children: []
    };
    if (level === 0 || !stack[level - 1]) {
      root.push(node);
      stack[0] = node;
      stack.length = 1;
      return;
    }
    const parent = stack[level - 1];
    parent.children.push(node);
    stack[level] = node;
    stack.length = level + 1;
  });
  return root;
};
var renderNestedNodes = (nodes) => nodes.map((node) => {
  const childrenHtml = node.children.length ? `<ul>${renderNestedNodes(node.children)}</ul>` : "";
  return `<li>${escapeHtml(node.text)}${childrenHtml}</li>`;
}).join("");
var renderListItems = (value) => renderNestedNodes(buildNestedList(normalizeValueToListItems(value)));
var renderUpdateConsiderations = (value) => {
  const [title, ...details] = normalizeValueToListItems(value).filter(
    (item) => item.text.trim()
  );
  if (!title) return "";
  const detailItemsHtml = details.map((item) => `<li><em>${escapeHtml(item.text.trim())}</em></li>`).join("");
  const detailsHtml = detailItemsHtml ? `<ul style="margin: 0 0 0 18px; padding-left: 18px; list-style-type: circle;">${detailItemsHtml}</ul>` : "";
  return `<div style="margin: 0 0 0 36px;">
  <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(title.text.trim())}</strong></p>
  ${detailsHtml}
</div>`;
};
var stringifyValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.text).join(" ").trim();
  }
  return value;
};
var renderValue = (key, value) => {
  if (htmlKeys.has(key)) {
    return stringifyValue(value);
  }
  if (key === "updateConsiderations") {
    return renderUpdateConsiderations(value);
  }
  if (listItemKeys.has(key)) {
    return renderListItems(value);
  }
  return escapeHtml(stringifyValue(value)).replace(/\n/g, "<br />");
};
var renderTemplate = (template, data, options = { escapeValues: true }) => {
  if (options.escapeValues === false) {
    return template.replace(
      /{{\s*([\w.-]+)\s*}}/g,
      (_, key) => stringifyValue(data[key] ?? "")
    );
  }
  return template.replace(
    /{{\s*([\w.-]+)\s*}}/g,
    (_, key) => renderValue(key, data[key] ?? "")
  );
};

// src/utils/helpers/ticketUrl.ts
var stringifyTemplateValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.text).join(" ").trim();
  }
  return value?.trim() ?? "";
};
var getTicketNumberId = (ticketNumber) => ticketNumber.replace(/^T\s*-\s*/i, "").trim();
var buildTicketUrlReplacementData = (data) => {
  const ticketDisplayNumber = stringifyTemplateValue(data.ticketNumber);
  const ticketNumberId = getTicketNumberId(ticketDisplayNumber);
  const stringifiedData = Object.entries(data).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: stringifyTemplateValue(value)
    }),
    {}
  );
  return {
    ...stringifiedData,
    ticketNumber: ticketNumberId,
    ticketNumberId,
    ticketDisplayNumber
  };
};
var renderTicketUrl = (ticketUrlTemplate, data) => {
  const replacementData = buildTicketUrlReplacementData(data);
  return ticketUrlTemplate.replace(
    /{{\s*([\w.-]+)\s*}}/g,
    (_, key) => encodeURIComponent(replacementData[key] ?? "")
  );
};
var buildTicketUrlTemplateData = (config, data) => ({
  ticketUrl: renderTicketUrl(config.ticketUrlTemplate, data)
});

// src/utils/helpers/estimationBreakdown.ts
var taskLabels = [
  "Solution design & estimation",
  "Development, testing & documentation",
  "Testing (non-dev)",
  "Migrations to QA & PROD",
  "QA Support",
  "Hypercare Support",
  "Management"
];
var buildEmptyEditableCell = () => '<td style="border: 1px solid #a6a6a6; padding: 6px 8px; text-align: center; min-width: 52px;">&nbsp;</td>';
var buildTaskRow = (taskLabel) => `
  <tr>
    <td style="border: 1px solid #a6a6a6; padding: 6px 8px; min-width: 275px;">${taskLabel}</td>
    ${buildEmptyEditableCell()}
  </tr>`;
var buildEstimationBreakdownTableHtml = () => `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px; color: #222; margin: 10px 0 0 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #a6a6a6; padding: 6px 8px; min-width: 275px; background: #bdd7ee; text-align: left; font-weight: 400;">Task</th>
      <th style="border: 1px solid #a6a6a6; padding: 6px 8px; min-width: 52px; background: #bdd7ee; text-align: center; font-weight: 400;">Hours</th>
    </tr>
  </thead>
  <tbody>
    ${taskLabels.map(buildTaskRow).join("")}
    <tr>
      <td style="border: 1px solid #a6a6a6; padding: 6px 8px; font-weight: 700;">Total</td>
      <td style="border: 1px solid #a6a6a6; padding: 6px 8px; text-align: center; font-weight: 700;">&nbsp;</td>
    </tr>
  </tbody>
</table>
`;
var buildEstimationBreakdownTemplateData = (templateId) => ({
  estimationBreakdownTable: templateId === "estimation" ? buildEstimationBreakdownTableHtml() : ""
});

// src/utils/helpers/templateData.ts
var isEmptyTemplateValue = (value) => {
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => !item.text.trim());
  }
  return !value?.trim();
};
var applyEmptyFieldFallback = (data, fieldKeys, emptyFieldFallback) => {
  const fallback = emptyFieldFallback.trim();
  if (!fallback) return data;
  return fieldKeys.reduce((acc, key) => {
    const currentValue = acc[key];
    if (!isEmptyTemplateValue(currentValue)) return acc;
    return {
      ...acc,
      [key]: Array.isArray(currentValue) ? [{ text: fallback, level: 0 }] : fallback
    };
  }, { ...data });
};
export {
  applyEmptyFieldFallback,
  buildEstimationBreakdownTemplateData,
  buildTicketUrlTemplateData,
  defaultConfig,
  estimationTemplate,
  parseStructuredText,
  renderTemplate
};
