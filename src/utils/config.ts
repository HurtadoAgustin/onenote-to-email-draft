import { defaultTemplateId } from "../templateRegistry";
import type { EmailTemplateId } from "./types";
import type { ExtensionConfig, LegacyExtensionConfig } from "./types";

const CONFIG_STORAGE_KEY = "onenoteToMailDraftConfig";

export const defaultConfig: ExtensionConfig = {
  mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
  technicalArchitect: "",
  emptyFieldFallback: "",
  ticketUrlTemplate: "https://request-sa2.odoo.com/web#id={{ticketNumber}}&menu_id=87&cids=1&action=140&model=project.task&view_type=form",
  templateOverrides: {},
  customTemplates: [],
  selectors: {
    oneNoteRoot: "",
    gmailComposeDialog: "div[role='dialog']",
    gmailSubject: "input[name='subjectbox']",
    gmailBody: "div[aria-label='Message Body'], div[role='textbox'][aria-label]"
  },
  flags: {
    allowIncompleteFields: true
  }
};

const migrateLegacyTemplateOverride = (
  savedConfig: LegacyExtensionConfig | undefined
): ExtensionConfig["templateOverrides"] => {
  const existingOverrides = savedConfig?.templateOverrides ?? {};

  if (
    !savedConfig?.subjectTemplate &&
    !savedConfig?.bodyTemplate &&
    !savedConfig?.fieldMappings
  ) {
    return existingOverrides;
  }

  const legacyOverride = {
    ...(savedConfig.subjectTemplate ? { subjectTemplate: savedConfig.subjectTemplate } : {}),
    ...(savedConfig.bodyTemplate ? { bodyTemplate: savedConfig.bodyTemplate } : {}),
    ...(savedConfig.fieldMappings ? { fieldMappings: savedConfig.fieldMappings } : {})
  };

  return {
    ...existingOverrides,
    [defaultTemplateId as EmailTemplateId]: {
      ...existingOverrides[defaultTemplateId],
      ...legacyOverride
    }
  };
};

export const getConfig = async (): Promise<ExtensionConfig> => {
  const result = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
  const savedConfig = result[CONFIG_STORAGE_KEY] as LegacyExtensionConfig | undefined;

  return {
    mailUrl: savedConfig?.mailUrl ?? defaultConfig.mailUrl,
    technicalArchitect: savedConfig?.technicalArchitect ?? defaultConfig.technicalArchitect,
    emptyFieldFallback: savedConfig?.emptyFieldFallback ?? defaultConfig.emptyFieldFallback,
    ticketUrlTemplate: savedConfig?.ticketUrlTemplate ?? defaultConfig.ticketUrlTemplate,
    templateOverrides: migrateLegacyTemplateOverride(savedConfig),
    customTemplates: Array.isArray(savedConfig?.customTemplates)
      ? savedConfig!.customTemplates
      : defaultConfig.customTemplates,
    selectors: {
      ...defaultConfig.selectors,
      ...savedConfig?.selectors
    },
    flags: {
      allowIncompleteFields:
        savedConfig?.flags?.allowIncompleteFields ??
        defaultConfig.flags.allowIncompleteFields
    }
  };
};

export const saveConfig = async (config: ExtensionConfig): Promise<void> => {
  await chrome.storage.local.set({
    [CONFIG_STORAGE_KEY]: config
  });
};

export const resetConfig = async (): Promise<ExtensionConfig> => {
  await chrome.storage.local.remove(CONFIG_STORAGE_KEY);
  return defaultConfig;
};
