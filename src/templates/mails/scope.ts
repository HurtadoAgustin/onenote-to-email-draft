import { changeOrderDocumentationProfile } from "../docs/changeOrderDocumentation";
import { changeOrderFieldMappings } from "../../templateRegistry/sharedFieldMappings";
import type { EmailTemplate } from "../../utils/types";

export const scopeTemplate: EmailTemplate = {
  id: "scope",
  label: "Alcance",
  description: "Shares the functional/technical scope from the documentation.",
  subjectTemplate: "[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Buenos días equipo,</p>

  <p>Les comparto este email donde proponemos un diseño de solución para el requerimiento mencionado. Les pido por favor que revisen a continuación las condiciones y nos indiquen si cumple con lo que necesitan o si hace falta algún cambio.</p>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Título</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Motivo de la Orden de Cambio</h2>
  <ul>
    <li>{{motivo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Descripción</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Condiciones de satisfacción</h2>

  <p style="margin: 10px 0 4px 36px;"><strong>Cambios de comportamiento</strong></p>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <p style="margin: 10px 0 4px 36px;"><strong>Condiciones de Integración con el ERP</strong></p>
  <ul style="margin-left: 36px;">
    {{integracion}}
  </ul>

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Consideraciones para Updates</h2>
  {{updateConsiderations}}

  <p>Quedamos atentos a cualquier comentario o sugerencia.<br />Saludos.</p>
</div>
  `,
  fieldMappings: changeOrderFieldMappings,
  documentationProfile: changeOrderDocumentationProfile
};
