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
  }
];

export const changeOrderFieldMappings: FieldMapping[] = [
  ...changeOrderMetadataFieldMappings,
  ...changeOrderContentFieldMappings
];
