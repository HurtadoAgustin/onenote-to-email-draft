import { changeOrderFieldMappings } from "../templateRegistry/sharedFieldMappings";
import type { EmailTemplate } from "../templateRegistry/types";

export const estimationTemplate: EmailTemplate = {
  id: "estimation",
  label: "Estimación",
  description: "Sends the estimation email for a ticket.",
  subjectTemplate: "[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Buenos días,</p>

  <p>Te envío la estimación correspondiente al ticket <a href="{{ticketUrl}}" target="_blank" style="color: #1b77c5; text-decoration: underline;">{{ticketNumber}}</a>. La misma deberá ser enviada a {{clientChoRequester}}.</p>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Título</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Motivo de la Orden de Cambio</h2>
  <ul>
    <li>{{motivo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Descripción</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Condiciones de satisfacción</h2>

  <p style="margin-left: 36px;"><strong>Cambios de comportamiento</strong></p>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <p style="margin-left: 36px;"><strong>Condiciones de Integración con el ERP</strong></p>
  <ul style="margin-left: 36px;">
    {{integracion}}
  </ul>

  {{signatureSeparator}}
  {{signature}}
</div>
`,
  fieldMappings: changeOrderFieldMappings
};
