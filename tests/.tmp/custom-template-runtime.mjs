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

// src/utils/helpers/customTemplate.ts
var BUILT_IN_IDS = /* @__PURE__ */ new Set(["estimation", "scope", "completedQa"]);
var generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
var createCustomTemplate = () => ({
  id: generateId(),
  label: "",
  description: "",
  subjectTemplate: "",
  bodyTemplate: "",
  fieldMappings: [],
  documentationProfile: changeOrderDocumentationProfile
});
var validateCustomTemplate = (template, existingIds) => {
  if (!template.id || template.id.trim() === "") {
    return { ok: false, error: "Template id is missing." };
  }
  if (BUILT_IN_IDS.has(template.id)) {
    return {
      ok: false,
      error: "Template id collides with a built-in template id."
    };
  }
  if (existingIds.includes(template.id)) {
    return { ok: false, error: "Template id already exists." };
  }
  if (!template.label || template.label.trim() === "") {
    return { ok: false, error: "Label is required." };
  }
  if (!template.subjectTemplate || template.subjectTemplate.trim() === "") {
    return { ok: false, error: "Subject template is required." };
  }
  return { ok: true };
};
var isValidCustomTemplate = (template) => {
  if (!template || typeof template !== "object") {
    return false;
  }
  const t = template;
  return typeof t.id === "string" && t.id.length > 0 && typeof t.label === "string" && typeof t.description === "string" && typeof t.subjectTemplate === "string" && typeof t.bodyTemplate === "string" && Array.isArray(t.fieldMappings) && t.documentationProfile !== void 0 && t.documentationProfile !== null;
};
export {
  createCustomTemplate,
  isValidCustomTemplate,
  validateCustomTemplate
};
