import type {
  EmailTemplateId,
  EmailTemplateOverride,
  FieldMapping
} from "../utils/types";

export type { EmailTemplateId, EmailTemplateOverride };

export type EmailTemplate = {
  id: EmailTemplateId;
  label: string;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
  fieldMappings: FieldMapping[];
};
