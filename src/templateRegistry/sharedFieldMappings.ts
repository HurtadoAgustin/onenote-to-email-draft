import type { FieldMapping } from "../utils/types";

export const changeOrderMetadataFieldMappings: FieldMapping[] = [
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

export const changeOrderContentFieldMappings: FieldMapping[] = [
  {
    key: "titulo",
    labels: ["Title", "Título", "Titulo"],
    required: true
  },
  {
    key: "motivo",
    labels: ["Change Order Reason", "Motivo de la Orden de Cambio"],
    required: true
  },
  {
    key: "descripcion",
    labels: ["Description", "Descripción", "Descripcion"],
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
      "Condiciones de Integración con el ERP",
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
      "Consideraciones de Actualización",
      "Consideraciones de Actualizacion",
      "Consideraciones por actualización",
      "Consideraciones por actualizacion"
    ],
    required: false
  },
  {
    key: "technicalConditions",
    labels: [
      "Technical Conditions",
      "Condiciones Técnicas",
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

export const changeOrderFieldMappings: FieldMapping[] = [
  ...changeOrderMetadataFieldMappings,
  ...changeOrderContentFieldMappings
];
