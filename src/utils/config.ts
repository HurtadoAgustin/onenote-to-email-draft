import type { ExtensionConfig } from "./types";

export const CONFIG_STORAGE_KEY = "onenoteDraftBridge.config";

export const defaultConfig: ExtensionConfig = {
  mailUrl: "https://outlook.office.com/mail/deeplink/compose",
  subjectTemplate: "Ticket {{ticket}} - {{cliente}}",
  bodyTemplate: `<p>Hola,</p>
<p>Compartimos el resumen del caso:</p>
<ul>
  <li><strong>Cliente:</strong> {{cliente}}</li>
  <li><strong>Ticket:</strong> {{ticket}}</li>
  <li><strong>Problema:</strong> {{problema}}</li>
  <li><strong>Resolución:</strong> {{resolucion}}</li>
</ul>
{{firma}}`,
  signatureHtml: "<p>Saludos,</p>",
  fieldMappings: [
    { key: "cliente", labels: ["Cliente"], required: true },
    { key: "ticket", labels: ["Ticket"], required: true },
    { key: "problema", labels: ["Problema"], required: false },
    { key: "resolucion", labels: ["Resolución", "Resolucion"], required: false }
  ],
  selectors: {
    oneNoteRoot: "body",
    outlookNewMailButton: 'button[aria-label="New mail"], button[aria-label="Nuevo correo"], button[aria-label="Nuevo mensaje"]',
    outlookSubject: 'input[aria-label="Add a subject"], input[aria-label="Agregar un asunto"], input[aria-label="Asunto"], [aria-label="Add a subject"], [aria-label="Agregar un asunto"]',
    outlookBody: 'div[aria-label="Message body"], div[aria-label="Cuerpo del mensaje"], [role="textbox"][aria-label*="Message"], [role="textbox"][aria-label*="mensaje"]',
    outlookTo: 'div[aria-label="To"], div[aria-label="Para"], [aria-label="To"], [aria-label="Para"]'
  },
  flags: {
    autoOpenCompose: true,
    insertSignature: true,
    allowIncompleteFields: true
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeConfig = (saved?: Partial<ExtensionConfig>): ExtensionConfig => ({
  ...defaultConfig,
  ...(saved ?? {}),
  selectors: {
    ...defaultConfig.selectors,
    ...(isObject(saved?.selectors) ? saved.selectors : {})
  },
  flags: {
    ...defaultConfig.flags,
    ...(isObject(saved?.flags) ? saved.flags : {})
  },
  fieldMappings: Array.isArray(saved?.fieldMappings)
    ? saved.fieldMappings
    : defaultConfig.fieldMappings
});

export const getConfig = async (): Promise<ExtensionConfig> => {
  const result = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
  return mergeConfig(result[CONFIG_STORAGE_KEY]);
};

export const saveConfig = async (config: ExtensionConfig): Promise<void> => {
  await chrome.storage.local.set({ [CONFIG_STORAGE_KEY]: config });
};

export const resetConfig = async (): Promise<ExtensionConfig> => {
  await saveConfig(defaultConfig);
  return defaultConfig;
};
