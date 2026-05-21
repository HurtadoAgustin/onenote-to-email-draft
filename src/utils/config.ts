import { defaultTemplateId } from "../templateRegistry";
import type { EmailTemplateId } from "../templateRegistry/types";
import type { ExtensionConfig, LegacyExtensionConfig } from "./types";

const CONFIG_STORAGE_KEY = "onenoteToMailDraftConfig";

export const defaultConfig: ExtensionConfig = {
  mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
  signatureHtml: "",
  emptyFieldFallback: "",
  ticketUrlTemplate: "https://request-sa2.odoo.com/web#id={{ticketNumber}}&menu_id=87&cids=1&action=140&model=project.task&view_type=form",
  templateOverrides: {},
  selectors: {
    oneNoteRoot: "",
    gmailComposeDialog: "div[role='dialog']",
    gmailSubject: "input[name='subjectbox']",
    gmailBody: "div[aria-label='Message Body'], div[role='textbox'][aria-label]"
  },
  flags: {
    insertSignature: true,
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
    ...defaultConfig,
    ...savedConfig,
    templateOverrides: migrateLegacyTemplateOverride(savedConfig),
    selectors: {
      ...defaultConfig.selectors,
      ...savedConfig?.selectors
    },
    flags: {
      ...defaultConfig.flags,
      ...savedConfig?.flags
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
