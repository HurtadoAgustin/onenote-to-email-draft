# Contrato: Configuración Persistida en chrome.storage.local

**Funcionalidad**: 001-auth-trust-model
**Fecha**: 2026-06-23

## Descripción

`ExtensionConfig` es el único objeto persistido por la extensión. Vive
en `chrome.storage.local` bajo la clave `onenoteToMailDraftConfig`.

## Clave de Almacenamiento

```
onenoteToMailDraftConfig
```

## Forma del Valor

```ts
type ExtensionConfig = {
  mailUrl: string;
  technicalArchitect: string;
  emptyFieldFallback: string;
  ticketUrlTemplate: string;
  templateOverrides: Partial<Record<EmailTemplateId, EmailTemplateOverride>>;
  selectors: ExtensionSelectors;
  flags: ExtensionFlags;
};

type ExtensionSelectors = {
  oneNoteRoot?: string;
  gmailComposeDialog?: string;
  gmailSubject?: string;
  gmailBody?: string;
};

type ExtensionFlags = {
  allowIncompleteFields: boolean;
};

type EmailTemplateOverride = Partial<{
  subjectTemplate: string;
  bodyTemplate: string;
  fieldMappings: FieldMapping[];
}>;
```

## Defaults (src/utils/config.ts)

```ts
const defaultConfig: ExtensionConfig = {
  mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
  technicalArchitect: "",
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
    allowIncompleteFields: true
  }
};
```

## Comportamiento de Lectura

`getConfig()`:

1. Lee `chrome.storage.local[onenoteToMailDraftConfig]`.
2. Combina cada campo con su default (merge superficial para
   `selectors` y `flags`; reemplazo para el resto).
3. Aplica `migrateLegacyTemplateOverride(savedConfig)` sobre
   `templateOverrides` (idempotente).
4. Devuelve un `ExtensionConfig` completo.

## Comportamiento de Escritura

`saveConfig(config)`:

- Sobrescribe `chrome.storage.local[onenoteToMailDraftConfig]` con el
  objeto recibido completo.

## Comportamiento de Restauración

`resetConfig()`:

- Borra la clave `onenoteToMailDraftConfig`.
- Devuelve `defaultConfig` (sin persistir).

## Migración desde Formato Heredado

`LegacyExtensionConfig` (campo raíz, no dentro de `templateOverrides`)
admite campos opcionales:

```ts
type LegacyExtensionConfig = Partial<ExtensionConfig> & {
  subjectTemplate?: string;
  bodyTemplate?: string;
  fieldMappings?: FieldMapping[];
};
```

`migrateLegacyTemplateOverride`:

- Si ninguno de los tres campos legacy está presente, retorna
  `existingOverrides` (idempotente).
- En caso contrario, construye un `EmailTemplateOverride` con los
  campos presentes y lo mezcla con `existingOverrides[defaultTemplateId]`,
  bajo `defaultTemplateId = "estimation"`.
- Los campos legacy son omitidos del objeto raíz resultante.

## Garantías

- **Sin credenciales**: la configuración no debe contener credenciales,
  tokens ni información personal identificable; la constitución del
  proyecto lo prohíbe explícitamente.
- **Sin persistencia de contenido**: la extensión nunca escribe
  contenido de OneNote, parseos ni borradores en
  `chrome.storage.local`.
- **Aislamiento por extensión**: otras extensiones con permiso
  `storage` podrían leer o modificar esta clave; el navegador no
  aísla `chrome.storage.local` entre extensiones del mismo origen.

## Versionado

- Añadir un campo nuevo a `ExtensionConfig` requiere:
  1. Declararlo en `src/utils/types.ts`.
  2. Inicializarlo en `defaultConfig` (`src/utils/config.ts`).
  3. Manejarlo en la UI de opciones (`src/options/main.tsx`) si debe
     ser editable por el usuario.
- Eliminar un campo existente es un cambio incompatible: las
  configuraciones guardadas en versiones anteriores contendrán el
  campo huérfano, que será ignorado por la lectura actual.
- Cambiar el nombre de la clave de almacenamiento es un cambio
  incompatible: requiere migración explícita.