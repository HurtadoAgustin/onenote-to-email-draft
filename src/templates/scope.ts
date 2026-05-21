import { changeOrderFieldMappings } from "../templateRegistry/sharedFieldMappings";
import type { EmailTemplate } from "../templateRegistry/types";

export const scopeTemplate: EmailTemplate = {
  id: "scope",
  label: "Alcance",
  description: "Shares the functional/technical scope from the documentation.",
  subjectTemplate: "[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Buenos días,</p>

  <p>Comparto el alcance correspondiente al ticket <a href="{{ticketUrl}}" target="_blank" style="color: #1b77c5; text-decoration: underline;">{{ticketNumber}}</a>:</p>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Título</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Descripción</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Alcance funcional</h2>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Condiciones de Integración con el ERP</h2>
  <ul style="margin-left: 36px;">
    {{integracion}}
  </ul>

  {{signatureSeparator}}
  {{signature}}
</div>
`,
  fieldMappings: changeOrderFieldMappings
};
