import type { ExtensionConfig } from "./types";

const CONFIG_STORAGE_KEY = "onenoteToMailDraftConfig";

export const defaultConfig: ExtensionConfig = {
  mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
  subjectTemplate: "Ticket {{ticket}} - {{cliente}}",
  bodyTemplate: `
<p>Hola,</p>
<p>Compartimos el resumen del caso:</p>
<ul>
  <li><strong>Cliente:</strong> {{cliente}}</li>
  <li><strong>Ticket:</strong> {{ticket}}</li>
  <li><strong>Problema:</strong> {{problema}}</li>
  <li><strong>Resolución:</strong> {{resolucion}}</li>
</ul>
{{firma}}
`,
  signatureHtml: "<p>Saludos,</p>",
  fieldMappings: [
    { key: "cliente", labels: ["Cliente"], required: true },
    { key: "ticket", labels: ["Ticket"], required: true },
    { key: "problema", labels: ["Problema"], required: false },
    { key: "resolucion", labels: ["Resolución", "Resolucion"], required: false }
  ],
  selectors: {
    oneNoteRoot: "",
    gmailComposeDialog: "div[role='dialog']",
    gmailSubject: "input[name='subjectbox']",
    gmailBody: "div[aria-label='Message Body'][contenteditable='true'], div[role='textbox'][contenteditable='true']"
  },
  flags: {
    insertSignature: true,
    allowIncompleteFields: true
  }
};

const mergeConfig = (storedConfig?: Partial<ExtensionConfig>): ExtensionConfig => ({
  ...defaultConfig,
  ...storedConfig,
  selectors: {
    ...defaultConfig.selectors,
    ...storedConfig?.selectors
  },
  flags: {
    ...defaultConfig.flags,
    ...storedConfig?.flags
  },
  fieldMappings: storedConfig?.fieldMappings?.length
    ? storedConfig.fieldMappings
    : defaultConfig.fieldMappings
});

export const getConfig = async (): Promise<ExtensionConfig> => {
  const result = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
  return mergeConfig(result[CONFIG_STORAGE_KEY] as Partial<ExtensionConfig> | undefined);
};

export const saveConfig = async (config: ExtensionConfig): Promise<void> => {
  await chrome.storage.local.set({ [CONFIG_STORAGE_KEY]: config });
};

export const resetConfig = async (): Promise<ExtensionConfig> => {
  await saveConfig(defaultConfig);
  return defaultConfig;
};
