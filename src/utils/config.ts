import type { ExtensionConfig } from "./types";

const CONFIG_STORAGE_KEY = "onenoteToMailDraftConfig";

export const defaultConfig: ExtensionConfig = {
  mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
  subjectTemplate: "[Ticket] {{titulo}}",
  bodyTemplate: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <p>Buenos días,</p>

  <p>Te envío la estimación correspondiente al ticket. La misma deberá ser enviada a xxx.</p>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Título</h2>
  <ul>
    <li>{{titulo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Motivo de la Orden de Cambio</h2>
  <ul>
    <li>{{motivo}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Descripción</h2>
  <ul>
    <li>{{descripcion}}</li>
  </ul>

  <h2 style="color: #1f4e79; font-size: 20px; font-weight: 400;">Condiciones de satisfacción</h2>

  <p style="margin-left: 36px;"><strong>Cambios de comportamiento</strong></p>
  <ul style="margin-left: 36px;">
    {{cambios}}
  </ul>

  <p style="margin-left: 36px;"><strong>Condiciones de Integración con el ERP</strong></p>
  <ul style="margin-left: 36px;">
    {{integracion}}
  </ul>

  {{firma}}
</div>
`,
  signatureHtml: "",
  fieldMappings: [
    {
      key: "titulo",
      labels: ["Title", "Título", "Titulo"],
      required: true
    },
    {
      key: "motivo",
      labels: ["Change Order Reason", "Motivo de la Orden de Cambio"],
      required: true
    },
    {
      key: "descripcion",
      labels: ["Description", "Descripción", "Descripcion"],
      required: true
    },
    {
      key: "cambios",
      labels: ["Behavior changes", "Cambios de comportamiento"],
      required: true
    },
    {
      key: "integracion",
      labels: [
        "ERP Integration Conditions",
        "ERP Integration Conditons",
        "Condiciones de Integración con el ERP",
        "Condiciones de Integracion con el ERP"
      ],
      required: false
    }
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
