# Plan de Implementación: Documentación del Modelo de Confianza de Autenticación

**Rama**: `[001-auth-trust-model]` | **Fecha**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Entrada**: Especificación de `/specs/001-auth-trust-model/spec.md`.

**Nota**: Este plan documenta la implementación existente (ingeniería inversa) tal como está hoy en el repositorio, sin proponer migraciones, refactorizaciones ni cambios tecnológicos.

## Resumen

El modelo de confianza de autenticación de la extensión OneNote to Mail
Draft no implementa autenticación propia: se apoya en la sesión del
navegador con OneNote Web y Gmail y en la lista de hosts declarada en
`public/manifest.json`. Este plan describe los componentes, servicios,
dependencias, flujo de datos, estructuras de datos, integraciones y
riesgos tal como están implementados hoy en `src/`, `tests/`,
`public/`, `scripts/` y la configuración de Vite + esbuild.

## Contexto Técnico

- **Lenguaje/Versión**: TypeScript estricto (target ES2020, jsx:
  `react-jsx`, `allowJs: false`); React 18+ con runtime automático de
  JSX; ESM (`"type": "module"`).
- **Dependencias principales**: `vite`, `@vitejs/plugin-react`, `react`,
  `react-dom`, `typescript`, `esbuild` (dev), `@types/chrome`,
  `@types/node`, `@types/react`, `@types/react-dom`.
- **Almacenamiento**: `chrome.storage.local` bajo la clave única
  `onenoteToMailDraftConfig`; sin IndexedDB, sin cookies, sin red.
- **Pruebas**: scripts ESM nativos de Node (`tests/*.test.mjs`) que
  usan `node:assert/strict` y empaquetan fuentes TypeScript vía esbuild
  a `tests/.tmp/`. No hay Jest/Vitest ni `npm test`.
- **Plataforma objetivo**: Chrome (Manifest V3, build target
  `chrome114`) y Edge (MV3). Sin polyfills para Safari/Firefox.
- **Tipo de proyecto**: extensión de navegador (MV3) con tres bundles
  (popup, options, background) y dos content scripts (OneNote, Gmail).
- **Metas de rendimiento**: NFR-004 fija el flujo completo ≤ 30s para
  una página típica de OneNote (extracción + parseo + apertura de
  Gmail + inserción del borrador).
- **Restricciones**: client-side only; sin backend, sin IA, sin red;
  la frontera de seguridad es la lista de hosts del manifiesto.
- **Escala/Alcance**: un usuario por perfil de navegador; la
  configuración es local y compartida entre usuarios del mismo perfil.

## Verificación de la Constitución

*PUERTA: Debe pasar antes de la Fase 0. Re-verificar tras la Fase 1.*

| Principio | Estado | Evidencia |
|-----------|--------|-----------|
| I. Solo del lado del cliente — sin backend, sin IA | ✅ Pasa | `src/utils/config.ts` usa `chrome.storage.local`; no hay `fetch`/`XMLHttpRequest`; `console.log` se limita a la consola del navegador. |
| II. Topología Manifest V3 | ✅ Pasa | `public/manifest.json` declara ESM background, content scripts IIFE, popup, options page, hosts permitidos; `scripts/build-extension.mjs` reproduce esa topología. |
| III. TypeScript estricto, ESM, JSX automático | ✅ Pasa | `tsconfig.json` con `strict`, `module: ESNext`, `moduleResolution: Bundler`, `jsx: react-jsx`, `allowJs: false`, `types: [chrome, node]`. |
| IV. Generación dirigida por plantillas | ✅ Pasa | `src/utils/template.ts` (`renderTemplate`, `escapeHtml`), `src/utils/parser.ts` (`parseStructuredText`, `applyDomListLevelHints`), `src/utils/dom.ts` (`insertHtmlIntoContentEditable`). |
| V. Pruebas con aserciones en Node puro | ✅ Pasa | `tests/onenote-ticket-metadata.test.mjs` y `tests/onenote-level-hints.test.mjs` usan `node:assert/strict`; sin framework. |

Todas las puertas pasan sin necesidad de justificación de violación.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-auth-trust-model/
├── plan.md              # Este archivo (salida de /speckit.plan)
├── research.md          # Salida Fase 0 (/speckit.plan)
├── data-model.md        # Salida Fase 1 (/speckit.plan)
├── quickstart.md        # Salida Fase 1 (/speckit.plan)
├── contracts/           # Salida Fase 1 (/speckit.plan)
│   ├── chrome-runtime-messages.md
│   ├── chrome-storage-config.md
│   └── template-placeholders.md
└── tasks.md             # Salida Fase 2 (/speckit.tasks - NO creado aquí)
```

### Código fuente (raíz del repositorio)

```text
src/
├── background/index.ts                    # Service worker ESM (orquestador)
├── content/onenote.ts                     # Content script (OneNote family, allFrames)
├── content/gmail.ts                       # Content script (mail.google.com)
├── options/main.tsx                       # UI React: página de opciones
├── options/styles.css
├── popup/main.tsx                         # UI React: popup de la extensión
├── popup/styles.css
├── templateRegistry/index.ts              # Registro de plantillas + overrides
├── templateRegistry/sharedFieldMappings.ts
├── templates/docs/changeOrderDocumentation.ts
├── templates/mails/estimation.ts          # Plantilla estimación
├── templates/mails/scope.ts               # Plantilla alcance
├── templates/mails/completedInQA.ts       # Plantilla "completado en QA"
├── utils/config.ts                        # getConfig / saveConfig / resetConfig + migración heredada
├── utils/dom.ts                           # waitForElement, insertHtmlIntoContentEditable, setNativeInputValue
├── utils/parser.ts                        # parseStructuredText, applyDomListLevelHints, getMissingRequiredFields
├── utils/template.ts                      # renderTemplate, escapeHtml, render de listas
├── utils/types.ts                         # Tipos compartidos
├── utils/helpers/chrome.ts                # getActiveTab, sendMessageToTab (con reintentos)
├── utils/helpers/error.ts                 # getErrorMessage
├── utils/helpers/estimationBreakdown.ts   # Tabla HTML de desglose de estimación
├── utils/helpers/onenoteExtraction.ts     # chrome.scripting.executeScript para OneNote
├── utils/helpers/templateData.ts          # applyEmptyFieldFallback, buildFoundFieldLogs
├── utils/helpers/ticketUrl.ts             # buildTicketUrlTemplateData
└── vite-env.d.ts

tests/
├── fixtures/onenote-level-hints-sample.json
├── fixtures/onenote-ticket-metadata-sample.txt
├── outputs/onenote-level-hints-result.json
├── outputs/onenote-ticket-metadata-result.json
├── .tmp/                                  # Bundles intermedios (git-trackeados)
├── onenote-level-hints.test.mjs           # Aserciones de inferencia de niveles DOM
└── onenote-ticket-metadata.test.mjs       # Aserciones de parser + template + ticketUrl

public/
└── manifest.json                          # Manifiesto MV3 (version 0.1.0)

scripts/
└── build-extension.mjs                    # Empaqueta background + content scripts con esbuild

vite.config.ts                             # Config multipágina (popup.html, options.html)
tsconfig.json                              # Config TS estricta
package.json                               # Scripts dev / build / typecheck
```

**Decisión de estructura**: se conserva la disposición actual (un único
proyecto MV3 con `src/` y `tests/` en la raíz, builds diferenciados por
Vite/esbuild según destino). No se introducen subproyectos, monorepos ni
alias de rutas.

## Componentes Involucrados

| Componente | Ruta | Rol |
|------------|------|-----|
| Background Service Worker | `src/background/index.ts` | Escucha `GENERATE_GMAIL_DRAFT`; orquesta extracción, parseo, render, apertura de Gmail e inserción. |
| Content Script OneNote | `src/content/onenote.ts` | Responde a `EXTRACT_ONENOTE_TEXT`; inyectado en hosts de la familia OneNote con `allFrames: true`. |
| Content Script Gmail | `src/content/gmail.ts` | Responde a `INSERT_GMAIL_DRAFT`; espera cuadro de composición, elimina firma, inserta asunto y HTML. |
| Popup | `src/popup/main.tsx` | UI React; muestra plantillas y dispara el flujo. |
| Options | `src/options/main.tsx` | UI React; edita `ExtensionConfig` y la persiste. |
| Template Registry | `src/templateRegistry/index.ts` | Lista de plantillas + `getEmailTemplateForConfig` que aplica overrides. |
| Shared Field Mappings | `src/templateRegistry/sharedFieldMappings.ts` | `changeOrderMetadataFieldMappings` + `changeOrderContentFieldMappings`. |
| Plantillas | `src/templates/mails/*.ts` | Asunto + cuerpo HTML + mapeos + perfil por plantilla. |
| Documentation Profile | `src/templates/docs/changeOrderDocumentation.ts` | `sectionHeadings` y `listFieldKeys` del perfil `changeOrder`. |
| Parser | `src/utils/parser.ts` | `parseStructuredText`, `applyDomListLevelHints`, `getMissingRequiredFields`. |
| Template Renderer | `src/utils/template.ts` | `renderTemplate`, `escapeHtml`, anidación de listas. |
| Config Manager | `src/utils/config.ts` | `getConfig`, `saveConfig`, `resetConfig`, `migrateLegacyTemplateOverride`. |
| DOM Utilities | `src/utils/dom.ts` | `waitForElement`, `insertHtmlIntoContentEditable`, `setNativeInputValue`. |
| Helper Chrome | `src/utils/helpers/chrome.ts` | `getActiveTab`, `sendMessageToTab` (reintentos). |
| Helper OneNote Extraction | `src/utils/helpers/onenoteExtraction.ts` | `chrome.scripting.executeScript` (función inyectada). |
| Helper Template Data | `src/utils/helpers/templateData.ts` | `applyEmptyFieldFallback`, `buildFoundFieldLogs`. |
| Helper Ticket URL | `src/utils/helpers/ticketUrl.ts` | `renderTicketUrl`, `buildTicketUrlTemplateData`. |
| Helper Estimation Breakdown | `src/utils/helpers/estimationBreakdown.ts` | `buildEstimationBreakdownTemplateData` (tabla HTML). |
| Helper Error | `src/utils/helpers/error.ts` | `getErrorMessage`. |
| Manifest | `public/manifest.json` | Declara MV3, hosts, content scripts, permisos. |
| Build Script | `scripts/build-extension.mjs` | esbuild → `dist/background/index.js`, `dist/content/onenote.js`, `dist/content/gmail.js`. |

## Servicios y Dependencias Existentes

### Servicios del navegador (chrome.*)

- **`chrome.runtime`** — bus de mensajes entre popup, background y
  content scripts; `sendMessage`, `onMessage`.
- **`chrome.tabs`** — `query({ active: true, currentWindow: true })`,
  `create({ url, active })`, `sendMessage`.
- **`chrome.scripting`** — `executeScript({ target: { tabId, allFrames:
  true }, args, func })`.
- **`chrome.storage.local`** — persistencia de configuración bajo
  `onenoteToMailDraftConfig`.

### Dependencias (package.json)

- **Runtime**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`,
  `typescript`. Versiones declaradas como `"latest"`.
- **Dev**: `esbuild`, `@types/chrome`, `@types/node`, `@types/react`,
  `@types/react-dom`.

### Tipos del dominio (src/utils/types.ts)

- `EmailTemplateId = "estimation" | "scope" | "completedQa"`
- `FieldMapping`, `DocumentationProfile`, `EmailTemplate`,
  `EmailTemplateOverride`, `ParsedListItem`, `OneNoteDomTextItem`,
  `TemplateValue`, `TemplateData`
- `ExtensionSelectors`, `ExtensionFlags`, `ExtensionConfig`,
  `LegacyExtensionConfig`
- `GenerateDraftResponse`, `ExtractOneNoteResponse`,
  `InsertGmailDraftResponse`
- `GenerateDraftPayload`, `ExtractOneNotePayload`,
  `InsertGmailDraftPayload`, `RuntimeMessage`

## Flujo de Datos

```
[Usuario en OneNote Web]
        │
        │ 1. clic en popup → Send email
        ▼
[popup/main.tsx]
   chrome.runtime.sendMessage({ type: "GENERATE_GMAIL_DRAFT", templateId })
        │
        ▼
[background/index.ts]  (service worker ESM)
   1. getConfig()  ──► chrome.storage.local[onenoteToMailDraftConfig]
   2. getEmailTemplateForConfig(templateId, overrides)
   3. getActiveTab()  ──► chrome.tabs.query
   4. extractOneNoteTextFromTab(tabId, selector)
        │
        ▼
   [chrome.scripting.executeScript  →  content script inyectado en OneNote]
        │  innerText filtrado + DOM items (TextRun/NormalTextRun)
        ▼
   ExtractOneNoteResponse { ok, text, domTextItems, logs }
        │
        ▼
   5. parseStructuredText(text, mappings, profile)
   6. applyDomListLevelHints(parsed, domTextItems, profile)
   7. getMissingRequiredFields(data, mappings)
   8. dataForTemplate = combine(
        baseData,
        buildTicketUrlTemplateData(config, data),
        buildEstimationBreakdownTemplateData(templateId),
        applyEmptyFieldFallback(..., fieldKeys, emptyFieldFallback)
      )
   9. subject = renderTemplate(template.subjectTemplate, dataForTemplate)
  10. html    = renderTemplate(template.bodyTemplate, { ...dataForTemplate, technicalArchitect })
  11. chrome.tabs.create({ url: config.mailUrl, active: true })
  12. sendMessageToTab(gmailTab.id, { type: "INSERT_GMAIL_DRAFT", subject, html, config }, 20, 1000)
        │
        ▼
[content/gmail.ts]
   1. waitForElement(composeSelector, 20000)
   2. findLatestComposeDialog(composeSelector)
   3. resolver subjectElement / bodyElement (con fallback waitForElement, 15000)
   4. subjectElement.focus() + setNativeInputValue(subjectElement, subject)
   5. insertHtmlIntoContentEditable(bodyElement, html):
        - bodyElement.focus()
        - eliminar .gmail_signature o [data-smartmail='gmail_signature']
        - bodyElement.innerHTML = html
        - dispatch InputEvent('input', { bubbles: true, cancelable: true })
   6. sendResponse({ ok: true, logs })
        │
        ▼
[background/index.ts] agrega logs (extracción, plantilla, gmail) → sendResponse
        │
        ▼
[popup/main.tsx] renderiza logs en <section className="logs">
```

Puntos de control del flujo:

- **Pérdida de sesión OneNote**: `extractOneNoteTextFromTab` captura
  excepciones y devuelve `ok: false` con logs.
- **Pestaña activa inexistente**: `getActiveTab()` puede devolver `null`;
  el background aborta con `❌ Active tab not found`.
- **Faltan campos obligatorios**: si `missingRequiredFields.length > 0`
  y `!config.flags.allowIncompleteFields`, el background aborta con
  `❌ Missing required fields: ...`.
- **Fallo de apertura de Gmail**: `chrome.tabs.create` puede devolver
  sin `id`; el background aborta con `❌ Gmail could not be opened`.
- **Reintentos de inserción**: `sendMessageToTab` reintenta 20 veces con
  1s de espera; tras agotar, devuelve error con `getErrorMessage`.

## Estructuras de Datos Principales

### `ExtensionConfig` (persistida en `chrome.storage.local`)

| Campo | Tipo | Default |
|-------|------|---------|
| `mailUrl` | `string` | `https://mail.google.com/mail/u/0/#inbox?compose=new` |
| `technicalArchitect` | `string` | `""` |
| `emptyFieldFallback` | `string` | `""` |
| `ticketUrlTemplate` | `string` | URL de Odoo con `{{ticketNumber}}` |
| `templateOverrides` | `Partial<Record<EmailTemplateId, EmailTemplateOverride>>` | `{}` |
| `selectors` | `ExtensionSelectors` | selectores por defecto de Gmail/OneNote |
| `flags` | `ExtensionFlags { allowIncompleteFields }` | `true` |

`LegacyExtensionConfig` añade `subjectTemplate?`, `bodyTemplate?`,
`fieldMappings?` para migración.

### `EmailTemplate`

| Campo | Tipo |
|-------|------|
| `id` | `EmailTemplateId` |
| `label` | `string` |
| `description` | `string` |
| `subjectTemplate` | `string` (con `{{key}}`) |
| `bodyTemplate` | `string` (HTML con `{{key}}`) |
| `fieldMappings` | `FieldMapping[]` |
| `documentationProfile` | `DocumentationProfile` |

### `DocumentationProfile` (perfil `changeOrder`)

- `id: "changeOrder"`
- `sectionHeadings: Record<string, string[]>` — claves:
  `definitionOfDone`, `keyCommunicationPoints`, `originalRequest`,
  `originalRequestTableFields`, `title`, `description`,
  `changeOrderReason`, `conditionsOfSatisfaction`, `behaviorChanges`,
  `erpIntegrationConditions`, `updateConsiderations`, `designNotes`,
  `technicalConditions`, `additionalContext`, `responsibleOfEstimation`,
  `acceptanceOfConditions`, `responsibleOfDevelopment`,
  `implementationComponentsModified`, `layoutModifications`,
  `upgradabilityNotes`, `upgradabilityTableFields`, `changelogs`,
  `additionalDevelopmentNotes`, `developerTests`,
  `nonDeveloperTests`, `keyEmailCommunication`, `updates`,
  `internalContext`, `estimationBreakdown`, `acceptanceMarkers`. Cada
  clave lleva una lista de etiquetas bilingües aceptadas.
- `listFieldKeys: string[]` — claves que se renderizan como listas
  anidadas: `cambios`, `integracion`, `updateConsiderations`,
  `technicalConditions`, `additionalContext`.

### `FieldMapping`

`{ key: string, labels: string[], required?: boolean }`. Las `labels`
incluyen variantes en español e inglés (p. ej. `["Title", "Título",
"Titulo"]`).

### `TemplateData`

`Record<string, string | ParsedListItem[]>` donde `ParsedListItem =
{ text, level }`.

### Bus de mensajes (`RuntimeMessage`)

- `GenerateDraftPayload`: `{ type: "GENERATE_GMAIL_DRAFT", templateId }`
- `ExtractOneNotePayload`: `{ type: "EXTRACT_ONENOTE_TEXT", config }`
- `InsertGmailDraftPayload`: `{ type: "INSERT_GMAIL_DRAFT", subject,
  html, config }`

Respuestas: `GenerateDraftResponse`, `ExtractOneNoteResponse`,
`InsertGmailDraftResponse` con la forma `{ ok: boolean, logs: string[] }`
(o `text?`, `domTextItems?` adicionales en extracción).

## Integraciones Externas

- **OneNote Web (lectura, cliente)** — `chrome.scripting.executeScript`
  inyecta una función en cada frame de los hosts permitidos. La función
  lee `document.body` (o el selector configurado), clona el árbol,
  descarta nodos `display:none`, `visibility:hidden` o de color rojizo,
  y serializa `innerText`. Adicionalmente, captura `span.TextRun` /
  `span.NormalTextRun` con sus `getBoundingClientRect()`, `aria-level`
  y `listStyleType` para alimentar la inferencia de niveles.
- **Gmail (escritura, cliente)** — `chrome.tabs.sendMessage` al content
  script en `https://mail.google.com/*`; el script manipula el DOM del
  cuadro de composición (selectores por defecto
  `div[role='dialog']`, `input[name='subjectbox']`, `div[aria-label='Message
  Body'][contenteditable='true']`, todos configurables vía
  `config.selectors`).
- **Almacenamiento local del navegador** — `chrome.storage.local` para
  `ExtensionConfig` bajo `onenoteToMailDraftConfig`.
- **Sin red** — no hay `fetch`, `XMLHttpRequest`, WebSocket, ni
  endpoints remotos; la única "red" usada es la del usuario contra
  OneNote y Gmail en su sesión normal del navegador.

## Riesgos y Consideraciones Técnicas

- **Acoplamiento a selectores de DOM**: los selectores por defecto de
  Gmail (`div[role='dialog']`, `input[name='subjectbox']`) y OneNote
  (`span.TextRun`/`span.NormalTextRun`) pueden romperse si el proveedor
  cambia su HTML. Mitigación: `config.selectors` permite sobrescribirlos
  desde la página de opciones.
- **Acoplamiento al perfil de documentación `changeOrder`**: el parser
  asume el formato documentado en `changeOrderDocumentationProfile`;
  plantillas OneNote con secciones no listadas en `sectionHeadings` no
  se reconocen y caen al parseo genérico por `FieldMapping`.
- **Tiempo de espera de inserción en Gmail**: `sendMessageToTab`
  reintenta 20 × 1s (~20s). Cargas lentas de Gmail o `document_idle`
  retrasado pueden agotar el presupuesto. No se contempla extenderlo.
- **Firmas de Gmail no estándar**: el removedor de firma solo maneja
  `.gmail_signature` y `[data-smartmail='gmail_signature']`; las firmas
  personalizadas pueden quedar duplicadas y requerir borrado manual.
- **Variabilidad de `innerText` por idioma/markup**: la normalización
  (`normalizeForMatch`, `stripLeadingBullet`) cubre casos comunes pero
  no garantiza robustez ante cambios de idioma o de viñetas en OneNote.
- **Versiones de navegador**: el build apunta a `chrome114`; versiones
  anteriores de Chrome/Edge podrían no soportar `chrome.scripting` o
 某些 APIs MV3.
- **`console.log` extensivo**: el código emite logs de extracción,
  parseo y selección a la consola del service worker; en sesiones
  prolongadas esto puede acumular contenido de OneNote en la consola
  del navegador (volátil, no persistido).
- **Migración de configuración heredada**: `migrateLegacyTemplateOverride`
  es idempotente y solo detecta tres campos legacy; cambios futuros en
  `LegacyExtensionConfig` requerirían actualizar la función de
  migración.
- **Acumulación de pestañas de Gmail**: cada uso abre una nueva pestaña;
  el usuario puede acumular pestañas tras varios envíos consecutivos
  (comportamiento documentado en el spec, edge case explícito).
- **Pérdida de logs al cerrar el popup**: si el popup se cierra durante
  la generación, los logs se pierden aunque el borrador se inserte
  correctamente en Gmail (comportamiento documentado en el spec, edge
  case explícito).

## Trazabilidad de Artefactos

| Artefacto | Ruta | Propósito |
|-----------|------|-----------|
| Especificación | [spec.md](spec.md) | Alcance, historias de usuario, requisitos, criterios. |
| Investigación | [research.md](research.md) | Hallazgos de la ingeniería inversa. |
| Modelo de datos | [data-model.md](data-model.md) | Entidades, campos, relaciones, ciclo de vida. |
| Contratos | [contracts/](contracts/) | Mensajes, configuración, placeholders. |
| Quickstart | [quickstart.md](quickstart.md) | Escenarios de validación manual. |

## Seguimiento de Complejidad

No hay violaciones de la constitución que requieran justificación. Esta
sección se deja intencionadamente vacía.

**Rama**: `001-auth-trust-model` | **Plan**: `specs/001-auth-trust-model/plan.md`