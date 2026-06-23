# Modelo de Datos: Modelo de Confianza de Autenticación

**Funcionalidad**: 001-auth-trust-model
**Fecha**: 2026-06-23
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Entidades

### 1. `ExtensionConfig`

Estado local persistido en `chrome.storage.local` bajo la clave
`onenoteToMailDraftConfig`.

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `mailUrl` | `string` | `https://mail.google.com/mail/u/0/#inbox?compose=new` | URL que abre nueva composición de Gmail. |
| `technicalArchitect` | `string` | `""` | Nombre que se añade al saludo (p. ej. "Buenos días John Doe"). |
| `emptyFieldFallback` | `string` | `""` | Texto que sustituye campos vacíos (p. ej. "N/A"). |
| `ticketUrlTemplate` | `string` | URL Odoo con `{{ticketNumber}}` | Se renderiza con `encodeURIComponent` por placeholder. |
| `templateOverrides` | `Partial<Record<EmailTemplateId, EmailTemplateOverride>>` | `{}` | Overrides por plantilla (`subjectTemplate`, `bodyTemplate`, `fieldMappings`). |
| `selectors` | `ExtensionSelectors` | selectores por defecto | Ver tabla abajo. |
| `flags` | `ExtensionFlags { allowIncompleteFields }` | `true` | Permite generar borradores con campos obligatorios faltantes. |

#### `ExtensionSelectors`

| Campo | Tipo | Default |
|-------|------|---------|
| `oneNoteRoot` | `string` (opcional) | `""` (cae a `document.body`) |
| `gmailComposeDialog` | `string` (opcional) | `div[role='dialog']` |
| `gmailSubject` | `string` (opcional) | `input[name='subjectbox']` |
| `gmailBody` | `string` (opcional) | `div[aria-label='Message Body'], div[role='textbox'][aria-label]` |

#### `LegacyExtensionConfig`

Añade `subjectTemplate?`, `bodyTemplate?`, `fieldMappings?` (a nivel
global) para migración desde la versión anterior sin esquema por
plantilla.

### 2. `EmailTemplate`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `EmailTemplateId` | `"estimation" \| "scope" \| "completedQa"` |
| `label` | `string` | Etiqueta visible (p. ej. "Estimación"). |
| `description` | `string` | Subtítulo en la UI. |
| `subjectTemplate` | `string` | Plantilla con placeholders `{{key}}`. |
| `bodyTemplate` | `string` | HTML con placeholders `{{key}}`. |
| `fieldMappings` | `FieldMapping[]` | Mapeos etiqueta → clave. |
| `documentationProfile` | `DocumentationProfile` | Perfil `changeOrder` único. |

### 3. `FieldMapping`

`{ key: string, labels: string[], required?: boolean }`. Las `labels`
incluyen variantes bilingües (ES/EN).

### 4. `DocumentationProfile` (perfil `changeOrder`)

| Subcampo | Tipo | Notas |
|----------|------|-------|
| `id` | `"changeOrder"` | Literal. |
| `sectionHeadings` | `Record<string, string[]>` | 27 secciones (`definitionOfDone`, `title`, `description`, `changeOrderReason`, `conditionsOfSatisfaction`, `behaviorChanges`, `erpIntegrationConditions`, `updateConsiderations`, `designNotes`, `technicalConditions`, `additionalContext`, etc.). |
| `listFieldKeys` | `string[]` | `["cambios", "integracion", "updateConsiderations", "technicalConditions", "additionalContext"]`. |

### 5. `TemplateData`

`Record<string, string | ParsedListItem[]>`. `ParsedListItem` es
`{ text: string, level: number }`.

### 6. `OneNoteDomTextItem`

Estructura interna que captura, por cada `span.TextRun` /
`span.NormalTextRun` dentro de `<li>`:

- `index`, `text`, `closestListText`, `className`, `tagName`
- `rectLeft`, `listItemRectLeft`, `markerRectLeft`, `markerMarginLeft`
- `computedLevelHint`, `ariaLevel`, `listStyleType`

Usada por `applyDomLevelsToList` para refinar los niveles inferidos
por indentación del texto.

### 7. `RuntimeMessage` (unión discriminada)

| Tipo | Payload |
|------|---------|
| `"GENERATE_GMAIL_DRAFT"` | `{ templateId: EmailTemplateId }` |
| `"EXTRACT_ONENOTE_TEXT"` | `{ config: ExtensionConfig }` |
| `"INSERT_GMAIL_DRAFT"` | `{ subject: string, html: string, config: ExtensionConfig }` |

### 8. Respuestas (`{ ok: boolean, logs: string[] }`)

- `GenerateDraftResponse`
- `ExtractOneNoteResponse` (añade `text?`, `domTextItems?`)
- `InsertGmailDraftResponse`

## Relaciones

```
ExtensionConfig
├── templateOverrides ──► EmailTemplateOverride ──► EmailTemplate (resuelto vía getEmailTemplateForConfig)
├── selectors ─────────► ExtensionSelectors
└── flags ─────────────► ExtensionFlags

EmailTemplate
├── fieldMappings ─────► FieldMapping[]
└── documentationProfile ──► DocumentationProfile
                                 ├── sectionHeadings
                                 └── listFieldKeys

ExtensionConfig ──persiste en──► chrome.storage.local[onenoteToMailDraftConfig]

RuntimeMessage (union)
├── GenerateDraftPayload ──popup ──► background
├── ExtractOneNotePayload ──background ──► OneNote content script
└── InsertGmailDraftPayload ──background ──► Gmail content script

TemplateData
├── strings ──► renderTemplate como escapeHtml
└── ParsedListItem[] ──► renderTemplate como <ul><li> anidados
```

## Ciclo de Vida

### `ExtensionConfig`

1. **Carga**: `getConfig()` lee `chrome.storage.local`; combina con
   `defaultConfig` (defaults profundos); aplica
   `migrateLegacyTemplateOverride` (idempotente).
2. **Uso**: el popup lee la config al abrir; el background la lee en
   cada `GENERATE_GMAIL_DRAFT`.
3. **Edición**: la página de opciones edita campos y llama
   `saveConfig(updatedConfig)` que escribe en `chrome.storage.local`.
4. **Restauración**: `resetConfig()` borra la clave y devuelve
   `defaultConfig`.
5. **Migración**: aplicada en cada lectura (ver F5 en research.md).

### `TemplateData`

1. **Generación**: `parseStructuredText(text, mappings, profile)`
   produce `TemplateData` desde texto plano de OneNote.
2. **Refinamiento**: `applyDomListLevelHints(data, domTextItems,
   profile)` ajusta los niveles de los campos listados en
   `documentationProfile.listFieldKeys`.
3. **Cómputo de derivados**: `buildTicketUrlTemplateData(config, data)`
   y `buildEstimationBreakdownTemplateData(templateId)` añaden `ticketUrl`
   y `estimationBreakdownTable`.
4. **Fallback de vacíos**: `applyEmptyFieldFallback(data, fieldKeys,
   emptyFieldFallback)` rellena con `emptyFieldFallback` los campos
   vacíos (si el fallback no está vacío).
5. **Renderizado**: `renderTemplate(template, data)` produce `subject`
   y `html` finales.

### `RuntimeMessage`

- **Disparo**: el popup envía al background con
  `chrome.runtime.sendMessage`.
- **Orquestación**: el background envía al content script con
  `chrome.tabs.sendMessage` (reintentos 20 × 1s).
- **Respuesta**: el content script responde con
  `sendResponse({ ok, logs })`; el background agrega logs y responde
  al popup.

## Reglas de Validación

- `mailUrl`: debe ser URL absoluta `https://mail.google.com/...` por
  defecto; no se valida formalmente.
- `ticketUrlTemplate`: debe contener `{{ticketNumber}}` para que la
  sustitución tenga efecto.
- `fieldMappings[].labels`: al menos una etiqueta por mapeo; variantes
  bilingües recomendadas.
- `fieldMappings[].required`: si es `true`, el campo debe estar
  presente en `TemplateData` (no vacío) para superar
  `getMissingRequiredFields`.
- `Empty field fallback`: si `emptyFieldFallback` está vacío, NO se
  aplica fallback (el campo queda vacío).
- `Empty array fallback`: si un campo de tipo lista está vacío y hay
  fallback, se inserta `[{ text: fallback, level: 0 }]`.

## Reglas de Negocio Implícitas

1. **Plantilla por defecto**: `defaultTemplateId === "estimation"`. La
   migración legacy aplica a esta plantilla.
2. **Tres plantillas registradas**: `estimation`, `scope`,
   `completedQa`. No se permite añadir plantillas en runtime sin
   editar `src/templates/mails/`.
3. **Perfil único**: solo `changeOrder` está implementado en
   `parseStructuredText`; otros perfiles caerían al parseo genérico
   por `FieldMapping`.
4. **Idioma del parser**: las etiquetas aceptadas son bilingües
   (ES/EN), pero el parser no es exhaustivo para otros idiomas.
5. **Formato de tickets**: el regex acepta `CHO-NNN` (3 dígitos) y
   `T-N+` (sin límite), ambos con normalización a mayúsculas y sin
   espacios.
6. **Firma de Gmail eliminada**: solo selectores estándar; firmas
   personalizadas pueden requerir borrado manual.
7. **Logs visibles en popup**: el popup muestra logs solo si la
   respuesta llega antes de que se desmonte; si se cierra antes, los
   logs se pierden (pero el borrador SÍ se inserta).