import { changeOrderDocumentationProfile } from "../docs/changeOrderDocumentation";
import { changeOrderFieldMappings } from "../../templateRegistry/sharedFieldMappings";
import type { EmailTemplate } from "../../utils/types";

export const completedQaTemplate: EmailTemplate = {
  id: "completedQa",
  label: "Completado en QA",
  description: "Notifies internally that QA validation has been completed.",
  subjectTemplate: "[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Estimados,</p>

  <p>
    El {{ticketNumber}} ha sido migrado exitosamente al ambiente de QA y está listo para las pruebas de usuarios. Debajo encontrarán un resumen de los cambios realizados y las pruebas a efectuar.
    <br />
    Este story fue desarrollado y probado internamente en base a las siguientes condiciones:.
  </p>

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

  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Este story incluye los siguientes cambios en el sistema:</h2>
  <ul></ul>
  
  <h2 style="color: #1f4e79; font-size: 18px; font-weight: 400; margin: 18px 0 8px 0;">Pruebas recomendadas:</h2>
  <ul></ul>

  <p>Quedo atento a cualquier comentario.<br />Saludos.</p>
</div>
  `,
  fieldMappings: changeOrderFieldMappings,
  documentationProfile: changeOrderDocumentationProfile
};
