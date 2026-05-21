import { changeOrderFieldMappings } from "../templateRegistry/sharedFieldMappings";
import type { EmailTemplate } from "../templateRegistry/types";

export const completedQaTemplate: EmailTemplate = {
  id: "completedQa",
  label: "Completado en QA",
  description: "Notifies internally that QA validation has been completed.",
  subjectTemplate: "[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Buenos días,</p>

  <p>Les comparto que el ticket fue completado en QA.</p>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Título</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Descripción</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Condiciones de satisfacción validadas</h2>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Condiciones de Integración con el ERP</h2>
  <ul style="margin-left: 36px;">
    {{integracion}}
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Consideraciones para Updates</h2>
  {{updateConsiderations}}

  <p>Quedo atento a cualquier comentario.</p>

  {{signatureSeparator}}
  {{signature}}
</div>
`,
  fieldMappings: changeOrderFieldMappings
};
