import type { EmailTemplateId, TemplateData } from "../types";

const taskLabels = [
  "Solution design & estimation",
  "Development, testing & documentation",
  "Testing (non-dev)",
  "Migrations to QA & PROD",
  "QA Support",
  "Hypercare Support",
  "Management"
];

const buildEmptyEditableCell = (): string =>
  '<td style="border: 1px solid #a6a6a6; padding: 6px 8px; text-align: center; min-width: 52px;">&nbsp;</td>';

const buildTaskRow = (taskLabel: string): string => `
  <tr>
    <td style="border: 1px solid #a6a6a6; padding: 6px 8px; min-width: 275px;">${taskLabel}</td>
    ${buildEmptyEditableCell()}
  </tr>`;

const buildEstimationBreakdownTableHtml = (): string => `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px; color: #222; margin: 10px 0 28px 0;">
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

export const buildEstimationBreakdownTemplateData = (
  templateId: EmailTemplateId
): TemplateData => ({
  estimationBreakdownTable: templateId === "estimation"
    ? buildEstimationBreakdownTableHtml()
    : ""
});
