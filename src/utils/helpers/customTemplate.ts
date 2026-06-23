import { changeOrderDocumentationProfile } from "../../templates/docs/changeOrderDocumentation";
import type { EmailTemplate } from "../types";

const BUILT_IN_IDS = new Set<string>(["estimation", "scope", "completedQa"]);

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createCustomTemplate = (): EmailTemplate => ({
  id: generateId(),
  label: "",
  description: "",
  subjectTemplate: "",
  bodyTemplate: "",
  fieldMappings: [],
  documentationProfile: changeOrderDocumentationProfile
});

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export const validateCustomTemplate = (
  template: EmailTemplate,
  existingIds: string[]
): ValidationResult => {
  if (!template.id || template.id.trim() === "") {
    return { ok: false, error: "Template id is missing." };
  }

  if (BUILT_IN_IDS.has(template.id)) {
    return {
      ok: false,
      error: "Template id collides with a built-in template id."
    };
  }

  if (existingIds.includes(template.id)) {
    return { ok: false, error: "Template id already exists." };
  }

  if (!template.label || template.label.trim() === "") {
    return { ok: false, error: "Label is required." };
  }

  if (!template.subjectTemplate || template.subjectTemplate.trim() === "") {
    return { ok: false, error: "Subject template is required." };
  }

  return { ok: true };
};

export const isValidCustomTemplate = (
  template: unknown
): template is EmailTemplate => {
  if (!template || typeof template !== "object") {
    return false;
  }

  const t = template as Record<string, unknown>;

  return (
    typeof t.id === "string" &&
    t.id.length > 0 &&
    typeof t.label === "string" &&
    typeof t.description === "string" &&
    typeof t.subjectTemplate === "string" &&
    typeof t.bodyTemplate === "string" &&
    Array.isArray(t.fieldMappings) &&
    t.documentationProfile !== undefined &&
    t.documentationProfile !== null
  );
};
