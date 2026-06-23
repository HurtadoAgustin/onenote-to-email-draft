# Contrato: Mensajes del Bus de Chrome Runtime

**Funcionalidad**: 001-auth-trust-model
**Fecha**: 2026-06-23

## Descripción

El bus de mensajes interno de la extensión transporta tres tipos de
payload entre el popup, el service worker y los content scripts. Todos
los mensajes se envían con `chrome.runtime.sendMessage` (popup → SW) o
`chrome.tabs.sendMessage` (SW → content script) y se identifican por
el discriminador `type`.

## Tipos

```ts
type RuntimeMessage =
  | GenerateDraftPayload
  | ExtractOneNotePayload
  | InsertGmailDraftPayload;
```

## Mensajes

### `GENERATE_GMAIL_DRAFT`

**Dirección**: popup → background (service worker).

**Payload**:

```ts
type GenerateDraftPayload = {
  type: "GENERATE_GMAIL_DRAFT";
  templateId: EmailTemplateId;
};
```

**Respuesta**:

```ts
type GenerateDraftResponse = {
  ok: boolean;
  logs: string[];
};
```

**Semántica**:

- `templateId` DEBE ser uno de `"estimation"`, `"scope"`,
  `"completedQa"`.
- El background resuelve la plantilla vía `getEmailTemplateForConfig`,
  lee `ExtensionConfig` desde `chrome.storage.local`, ejecuta el
  pipeline completo y agrega logs a la respuesta.
- Si la pestaña activa no es válida o la extracción falla, `ok` es
  `false` y `logs` contiene los mensajes de error.
- Si la inserción en Gmail tiene éxito, `ok` es `true` y `logs`
  contiene los mensajes de progreso (`✅`, `ℹ️`).

### `EXTRACT_ONENOTE_TEXT`

**Dirección**: background → content script de OneNote.

**Payload**:

```ts
type ExtractOneNotePayload = {
  type: "EXTRACT_ONENOTE_TEXT";
  config: ExtensionConfig;
};
```

**Respuesta**:

```ts
type ExtractOneNoteResponse = {
  ok: boolean;
  text?: string;
  domTextItems?: OneNoteDomTextItem[];
  logs: string[];
};
```

**Semántica**:

- El content script busca `config.selectors.oneNoteRoot` (si está
  definido) o usa `document.body` como fallback.
- Extrae `innerText` filtrando nodos ocultos o de color rojizo.
- Captura `span.TextRun` / `span.NormalTextRun` con metadatos de
  posición para inferencia de niveles.
- `ok: false` con `logs` si la raíz no se encuentra, si el texto
  visible está vacío, o si ocurre una excepción durante la
  extracción.

### `INSERT_GMAIL_DRAFT`

**Dirección**: background → content script de Gmail.

**Payload**:

```ts
type InsertGmailDraftPayload = {
  type: "INSERT_GMAIL_DRAFT";
  subject: string;
  html: string;
  config: ExtensionConfig;
};
```

**Respuesta**:

```ts
type InsertGmailDraftResponse = {
  ok: boolean;
  logs: string[];
};
```

**Semántica**:

- El content script espera hasta 20s a que aparezca el cuadro de
  composición (`config.selectors.gmailComposeDialog` o
  `div[role='dialog']` por defecto).
- Selecciona el último cuadro de composición visible en la pestaña.
- Resuelve `subjectElement` y `bodyElement` (con fallback de espera
  de 15s).
- Aplica `setNativeInputValue` al subject y
  `insertHtmlIntoContentEditable` al body.
- `ok: false` con `logs` si algún elemento no se encuentra dentro del
  presupuesto de tiempo.

## Garantías

- **No hay autenticación del remitente**: `chrome.runtime.onMessage`
  y `chrome.tabs.onMessage` no validan `_sender`; cualquier content
  script de la propia extensión puede emitir mensajes. La frontera de
  seguridad es el manifiesto de la extensión.
- **Reintentos**: el background reintenta `sendMessageToTab` 20 veces
  con 1s de espera entre cada uno (~20s total).
- **Respuesta asíncrona**: el listener debe devolver `true` para que
  el `sendResponse` posterior sea válido (esto ya está implementado
  en `src/background/index.ts`, `src/content/onenote.ts`,
  `src/content/gmail.ts`).

## Versionado

- El campo `type` es la única clave de contrato; añadir un nuevo tipo
  requiere extender `RuntimeMessage` en `src/utils/types.ts`.
- Añadir campos opcionales a payloads existentes es compatible hacia
  atrás mientras los consumidores actuales los ignoren.
- Eliminar o renombrar un `type` es un cambio incompatible.