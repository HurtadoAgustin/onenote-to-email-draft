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

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Título</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Descripción</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Condiciones de satisfacción validadas</h2>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <p>Quedo atento a cualquier comentario.</p>

  {{signatureSeparator}}
  {{signature}}
</div>
`,
  fieldMappings: changeOrderFieldMappings
};
