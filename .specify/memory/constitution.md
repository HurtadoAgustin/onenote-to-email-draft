<!--
Informe de impacto de sincronización:
- Cambio de versión: 1.0.0 → 1.0.1
- Principios modificados: ninguno (solo traducción de idioma)
- Secciones añadidas: ninguna
- Secciones eliminadas: ninguna
- Plantillas que requieren actualización:
  - .specify/templates/plan-template.md ✅ no requiere cambios (plantilla genérica de speckit)
  - .specify/templates/spec-template.md ✅ no requiere cambios (plantilla genérica de speckit)
  - .specify/templates/tasks-template.md ✅ no requiere cambios (plantilla genérica de speckit)
  - .specify/templates/checklist-template.md ✅ no requiere cambios (plantilla genérica de speckit)
  - .specify/templates/constitution-template.md ✅ no requiere cambios (plantilla genérica de speckit)
- Otros documentos traducidos: README.md (mismo idioma destino)
- Elementos diferidos: ninguno
-->

# Constitución de OneNote to Mail Draft

## Principios Fundamentales

### I. Solo del Lado del Cliente — Sin Backend, Sin IA

La extensión DEBE operar completamente en el navegador. No se realizan
peticiones de red a servicios externos para extracción de contenido,
parseo ni renderizado de plantillas. Las únicas interacciones de red son
las que el propio usuario realiza dentro de las pestañas de OneNote Web y
Gmail, en los hosts que el manifiesto ya autoriza. Los proveedores de IA,
las APIs de terceros y los servidores remotos no forman parte de la
arquitectura.

El estado persistente se limita a la configuración de usuario escrita en
`chrome.storage.local` (ver `src/utils/config.ts`). No se persiste
contenido de OneNote, datos parseados ni cuerpos de correo generados.

Justificación: el MVP está explícitamente posicionado como una utilidad
local que convierte texto de OneNote en un borrador de Gmail revisable
sin filtrar contenido a sistemas externos. Cualquier código futuro que
introduzca un backend, telemetría, llamada a IA o almacenamiento remoto
DEBE tratarse como un cambio arquitectónico incompatible.

### II. Topología de Extensión de Chrome en Manifest V3

El proyecto sigue la topología de Manifest V3 declarada en
`public/manifest.json`:

- Un **service worker ESM en segundo plano** en `src/background/index.ts`,
  compilado a `dist/background/index.js` con `format: "esm"`, que
  orquesta el flujo del borrador y agrega los registros.
- Un **content script por familia de hosts**, ambos empaquetados a IIFE:
  - `src/content/onenote.ts` para hosts de OneNote / Office / SharePoint /
    OneDrive (`all_frames: true`, `run_at: "document_idle"`).
  - `src/content/gmail.ts` para `https://mail.google.com/*`.
- Un **popup** (`popup.html` + `src/popup/main.tsx`) que inicia el flujo
  mediante `chrome.runtime.sendMessage`.
- Una **página de opciones** (`options.html` + `src/options/main.tsx`)
  que edita la configuración almacenada en `chrome.storage.local`.

La comunicación entre componentes pasa por el bus de mensajes tipado
declarado en `src/utils/types.ts` (`RuntimeMessage`):

- `GENERATE_GMAIL_DRAFT` (popup → background)
- `EXTRACT_ONENOTE_TEXT` (background → content script de OneNote)
- `INSERT_GMAIL_DRAFT` (background → content script de Gmail)

El service worker DEBE mantener sus responsabilidades en
`src/background/index.ts` acotadas: orquestar mensajes, ejecutar el
pipeline y agregar registros. La extracción dentro de la página de
OneNote DEBE ejecutarse mediante `chrome.scripting.executeScript` con
`target.allFrames: true` (ver `src/utils/helpers/onenoteExtraction.ts`).

Justificación: esta es la topología que se publica en `dist/` y la que
declara el manifiesto. Cualquier cambio en la lista de hosts autorizados
DEBE reflejarse en `public/manifest.json` `host_permissions` y en
`content_scripts.matches` en el mismo cambio.

### III. TypeScript Estricto, Módulos ESM, JSX Automático de React

El código base es TypeScript estricto en ESM:

- `tsconfig.json` habilita `"strict": true`, `"module": "ESNext"`,
  `"moduleResolution": "Bundler"`, `"isolatedModules": true`,
  `"jsx": "react-jsx"`, `"target": "ES2020"` e incluye
  `"types": ["chrome", "node"]`.
- `package.json` define `"type": "module"`; los archivos `*.ts` / `*.tsx`
  usan exclusivamente imports ESM.
- `src/**` es solo TypeScript (`allowJs: false`); se permite JavaScript
  únicamente en `tests/*.test.mjs` y `scripts/build-extension.mjs` porque
  se ejecutan con Node puro, no con Vite.
- Está habilitado el runtime automático de JSX de React (`react-jsx`); en
  `src/popup/main.tsx` y `src/options/main.tsx` se importa React
  explícitamente para los hooks que se utilizan.

`npm run typecheck` (es decir, `tsc --noEmit`) DEBE pasar antes de
considerar completo cualquier cambio. No existe un paso de typecheck de
lint separado; el script `typecheck` es la puerta de control estática
canónica.

Justificación: esta es la configuración de la que dependen Vite y
esbuild para empaquetar la extensión. Relajar cualquiera de estas
opciones (por ejemplo, habilitar `allowJs`, desactivar `strict` o
quitar los tipos de `chrome`) rompería la compilación u ocultaría
defectos que el parser de OneNote no tolera.

### IV. Generación de Correo Dirigida por Plantillas

El contenido del correo se produce mediante plantillas HTML con
placeholders `{{key}}` que se renderizan en `src/utils/template.ts`:

- Cada `EmailTemplate` (`src/utils/types.ts`) lleva un `subjectTemplate`,
  un `bodyTemplate`, `fieldMappings: FieldMapping[]` y un
  `documentationProfile: DocumentationProfile`.
- Los `fieldMappings` declaran las etiquetas de OneNote a buscar y si el
  campo es `required`; los campos obligatorios faltantes se reportan
  mediante `src/utils/helpers/templateData.ts` (`buildFoundFieldLogs`).
- `DocumentationProfile` (`id: "changeOrder"` más `sectionHeadings` y
  `listFieldKeys`) dirige el parseo estructurado en
  `src/utils/parser.ts`. El perfil `changeOrder` es el único perfil
  publicado actualmente.
- Las personalizaciones del usuario viven en `config.templateOverrides`
  y se aplican mediante `src/templateRegistry/index.ts`
  (`getEmailTemplateForConfig`).
- Hoy se publican tres plantillas: `estimation`, `scope`, `completedQa`
  (ver `src/templates/mails/`).

Las responsabilidades de parseo y renderizado se reparten así:

- `parseStructuredText` produce `TemplateData` (valores de cadena más
  `ParsedListItem[]`).
- `applyDomListLevelHints` mejora los niveles de las listas usando datos
  de rect del DOM cuando están disponibles
  (`LIST_LEVEL_TOLERANCE_PX = 18`).
- `renderTemplate` sustituye los placeholders, escapa HTML por defecto y
  emite `<ul><li>...</li></ul>` anidados para los campos de lista.
- `insertHtmlIntoContentEditable` (en `src/utils/dom.ts`) reemplaza por
  completo la firma automática de Gmail y el cuerpo del editor con el
  HTML renderizado y dispara `InputEvent("input", { bubbles: true })`.
- `setNativeInputValue` utiliza
  `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")`
  para activar los inputs controlados por React/Gmail.

Justificación: el valor de la extensión reside en que el cuerpo del
correo se deriva por completo de plantillas declarativas y de un parser
documentado. Codificar cadenas dentro de `src/background/index.ts`,
mutar el DOM fuera de los helpers dedicados o saltarse `renderTemplate`
erosionaría el contrato de las plantillas.

### V. Pruebas con Aserciones en Node Puro

Las pruebas son scripts ESM nativos de Node que empaquetan las fuentes
de TypeScript con esbuild y validan directamente con `node:assert/strict`.
No hay a propósito ningún framework de pruebas, ni Jest/Vitest, ni
script `npm test`:

- Los archivos de prueba viven en `tests/*.test.mjs`.
- Las entradas viven en `tests/fixtures/*`; los resultados esperados y
  las instantáneas se escriben desde la propia prueba en
  `tests/outputs/*`.
- El conjunto actual es:
  - `tests/onenote-ticket-metadata.test.mjs` — parser + URL del ticket +
    renderizado completo de la plantilla de estimación.
  - `tests/onenote-level-hints.test.mjs` — agrupación por `rectLeft` del
    DOM para niveles anidados de listas.
- Las pruebas se ejecutan manualmente
  (`node tests/<name>.test.mjs`) y salen con código de estado distinto de
  cero si falla cualquier `assert`. Los bundles intermedios se escriben
  en `tests/.tmp/`, que forma parte del árbol de trabajo (no figura en
  `.gitignore`).

La ejecución correcta de todos los scripts `tests/*.test.mjs` DEBE
quedar documentada en cualquier cambio que afecte a `src/utils/parser.ts`,
`src/utils/template.ts`, `src/utils/dom.ts`, `src/utils/helpers/*` o
`src/templates/**`.

Justificación: esta es la superficie de pruebas existente — no hay Jest,
no hay `npm test` y no hay CI configurada (no existe el directorio
`.github/`). Incorporar un nuevo runner ampliaría la cadena de
herramientas sin una necesidad que lo justifique.

## Stack Tecnológico

- **Lenguaje**: TypeScript (declarado como `"latest"` en `package.json`)
  con modo estricto y target ES2020.
- **UI**: React + `react-dom` (declarados como `"latest"`), renderizados
  con Vite.
- **Empaquetadores**:
  - Vite para las páginas de popup y opciones (entrada multipágina:
    `popup.html`, `options.html`), con `@vitejs/plugin-react`.
  - esbuild para el service worker en segundo plano y los dos content
    scripts, con `target: "chrome114"`, `sourcemap: true`,
    `minify: false`, ESM para el background y IIFE para los content
    scripts.
- **APIs del navegador**: `chrome.storage.local`, `chrome.tabs`,
  `chrome.scripting`, `chrome.runtime`, tipadas mediante `@types/chrome`.
- **Manifiesto**: Manifest V3 (`public/manifest.json`); versión fijada
  en `0.1.0` y reflejada en `package.json`.
- **Tipos de desarrollo**: `@types/chrome`, `@types/node`, `@types/react`,
  `@types/react-dom`.
- **SpecKit**: 0.11.3.dev0, integrado vía opencode, con la extensión
  `agent-context` habilitada (ver `.specify/extensions.yml`).

## Convenciones de Código

- Los archivos usan nombres en **camelCase** en `src/utils/` y
  `src/utils/helpers/`; los puntos de entrada de React se nombran
  `main.tsx`.
- Los imports son **relativos** (`../utils/types`); no hay alias de
  rutas configurados.
- Los tipos viven en `src/utils/types.ts`; cualquier tipo compartido
  nuevo DEBE declararse allí antes de importarse desde otro archivo. Los
  payloads entre componentes DEBEN extender `RuntimeMessage`.
- Los estilos son CSS plano por superficie (`src/popup/styles.css`,
  `src/options/styles.css`); no se usa CSS-in-JS ni preprocesador.
- Los archivos de código son mayoritariamente autoexplicativos; los
  comentarios se usan con moderación y solo cuando el porqué no es
  evidente (ver el bloque JSDoc en `src/utils/dom.ts` que documenta por
  qué la firma de Gmail se reemplaza por completo).
- Los registros se emiten mediante `console.log` (background, content
  scripts) y se exponen a través de `GenerateDraftResponse.logs`; las
  cadenas de log orientadas al usuario usan emojis (`✅`, `⚠️`, `❌`,
  `ℹ️`) como marcadores de estado.

## Privacidad y Seguridad

- La extensión NO DEBE exfiltrar contenido de OneNote, plantillas
  parseadas ni cuerpos de correo generados a ningún endpoint remoto.
- Los permisos de host están restringidos a:
  `https://*.onenote.com/*`, `https://*.office.com/*`,
  `https://*.officeapps.live.com/*`, `https://*.sharepoint.com/*`,
  `https://onedrive.live.com/*` y `https://mail.google.com/*`. Añadir un
  origen nuevo DEBE ser un cambio deliberado y documentado en
  `public/manifest.json`.
- La persistencia se limita a `chrome.storage.local` bajo la clave única
  `onenoteToMailDraftConfig`. Los campos heredados de override de
  plantilla única se migran a `templateOverrides[defaultTemplateId]`
  mediante `migrateLegacyTemplateOverride` en `src/utils/config.ts`.
- Todo el HTML renderizado en Gmail DEBE pasar por `escapeHtml` o ser un
  fragmento literal de plantilla authored por el proyecto; las cadenas
  controladas por el usuario nunca se interpolan en crudo.

## Build y Release

- `npm run dev` — Servidor de desarrollo de Vite
  (`vite --host 0.0.0.0`) para las páginas HTML del popup y de opciones.
- `npm run build` — `vite build && node scripts/build-extension.mjs`.
  Vite produce `dist/popup.html`, `dist/options.html` y los assets
  JS/CSS con hash; el `manifest.json` se copia dentro de `dist/`.
  esbuild produce `dist/background/index.js`,
  `dist/content/onenote.js` y `dist/content/gmail.js` con source maps.
- `npm run typecheck` — `tsc --noEmit`.
- La extensión empaquetada es el contenido de `dist/`; los usuarios la
  cargan como extensión sin empaquetar desde `chrome://extensions` o
  `edge://extensions` (ver `README.md`).
- `dist/`, `node_modules/`, `*.crx`, `*.pem` y los archivos `.env`
  están ignorados por git (ver `.gitignore`). Los artefactos de release
  (`dist.crx`, `dist.pem`) se generan fuera del flujo del repositorio.

## Flujo de Desarrollo

1. Realizar un cambio en `src/`.
2. Ejecutar `npm run typecheck`; DEBE pasar antes de hacer commit.
3. Ejecutar los scripts de prueba afectados directamente con Node
   (`node tests/onenote-ticket-metadata.test.mjs`,
   `node tests/onenote-level-hints.test.mjs`); ambos DEBEN pasar.
4. Ejecutar `npm run build` y cargar `dist/` como extensión sin
   empaquetar para validar manualmente los flujos de popup, opciones,
   extracción de OneNote y composición de Gmail de extremo a extremo.
5. Los cambios guiados por SpecKit (`/speckit.specify`, `/speckit.plan`,
   `/speckit.tasks`, `/speckit.implement`) DEBEN enrutar a través de
   `.specify/templates/*` y de la extensión `agent-context` declarada en
   `.specify/extensions.yml`.

## Gobernanza

Esta constitución es la fuente de verdad sobre la arquitectura del
proyecto, sus convenciones de código, la estrategia de pruebas y la
postura de privacidad. Prevalece sobre prácticas ad-hoc, sobre la guía
del README y sobre los comentarios en PRs.

- **Las enmiendas** DEBEN hacerse editando este archivo; los cambios
  sustantivos DEBEN aterrizar en `.specify/memory/constitution.md`, no
  dispersos en otros documentos.
- **La política de versionado** sigue SemVer:
  - **MAJOR** — cambios de gobernanza incompatibles hacia atrás (por
    ejemplo, introducir una dependencia remota, relajar las reglas de
    privacidad, sustituir el bus de mensajes).
  - **MINOR** — nuevo principio o sección, o ampliación material de la
    guía existente.
  - **PATCH** — aclaraciones, correcciones tipográficas, pulido de
    redacción.
- **La revisión de cumplimiento** se realiza en cada PR:
  - `npm run typecheck` está en verde.
  - Los scripts `tests/*.test.mjs` afectados pasan.
  - Cualquier host nuevo aparece en `public/manifest.json`
    `host_permissions` y en `content_scripts.matches`.
  - Cualquier estado persistente nuevo se declara en `ExtensionConfig`
    (`src/utils/types.ts`) y se inicializa por defecto en `defaultConfig`
    (`src/utils/config.ts`).
- **La guía de uso** está co-localizada: `README.md` para el flujo
  orientado al usuario, `AGENTS.md` para el contexto de agentes de IA,
  y `.specify/templates/*` para el flujo de SpecKit. NO DEBEN
  contradecir esta constitución; si lo hacen, gana esta constitución.

**Versión**: 1.0.1 | **Ratificada**: 2026-06-23 | **Última enmienda**: 2026-06-23