import { completedQaTemplate } from "../templates/completedQa";
import { estimationTemplate } from "../templates/estimation";
import { scopeTemplate } from "../templates/scope";
import type { EmailTemplate, EmailTemplateId, EmailTemplateOverride } from "./types";

export const emailTemplates: EmailTemplate[] = [
  estimationTemplate,
  scopeTemplate,
  completedQaTemplate
];

export const defaultTemplateId: EmailTemplateId = "estimation";

export const getEmailTemplate = (templateId: EmailTemplateId): EmailTemplate =>
  emailTemplates.find(template => template.id === templateId) ?? estimationTemplate;

export const applyEmailTemplateOverride = (
  template: EmailTemplate,
  override?: EmailTemplateOverride
): EmailTemplate => ({
  ...template,
  ...override,
  fieldMappings: override?.fieldMappings ?? template.fieldMappings
});

export const getEmailTemplateForConfig = (
  templateId: EmailTemplateId,
  overrides: Partial<Record<EmailTemplateId, EmailTemplateOverride>> = {}
): EmailTemplate => applyEmailTemplateOverride(getEmailTemplate(templateId), overrides[templateId]);
