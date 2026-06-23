# Investigación: Ingeniería Inversa del Modelo de Confianza

**Funcionalidad**: 001-auth-trust-model
**Fecha**: 2026-06-23
**Spec**: [spec.md](spec.md)

## Objetivo

Documentar el comportamiento real del código existente en
`src/`, `public/manifest.json`, `scripts/build-extension.mjs`,
`vite.config.ts` y `tsconfig.json` para describir con precisión el
modelo de confianza de autenticación de la extensión OneNote to Mail
Draft.

## Metodología

1. Lectura completa de los archivos fuente y de configuración.
2. Mapeo del bus de mensajes (`RuntimeMessage`) entre popup, background
   y content scripts.
3. Mapeo del ciclo de vida de `ExtensionConfig` (carga, defaults,
   migración, guardado, restauración).
4. Mapeo del flujo de extracción de OneNote (`chrome.scripting.executeScript`
   con `allFrames: true`).
5. Mapeo del flujo de inserción en Gmail (espera de cuadro de
   composición, eliminación de firma, reemplazo de `innerHTML`).
6. Mapeo del parser (`parseStructuredText`, `applyDomListLevelHints`).
7. Mapeo de las plantillas (`estimation`, `scope`, `completedQa`).
8. Mapeo del pipeline de pruebas (`tests/*.test.mjs`).

## Hallazgos

### F1 — No hay credenciales ni tokens en el código

- **Decisión documentada**: el código no implementa autenticación
  propia; no hay pantallas de login, flujos OAuth, ni almacenamiento de
  tokens.
- **Evidencia**: `src/utils/config.ts` solo persiste
  `ExtensionConfig` bajo `onenoteToMailDraftConfig`; los campos
  configurables son `mailUrl`, `technicalArchitect`,
  `emptyFieldFallback`, `ticketUrlTemplate`, `templateOverrides`,
  `selectors`, `flags`. Ninguno contiene credenciales.
- **Búsqueda negativa**: no hay `fetch`, `XMLHttpRequest`, `WebSocket`,
  `chrome.identity`, `chrome.webRequest`, ni `chrome.cookies` en el
  código fuente.

### F2 — La sesión del navegador es el "credential" real

- **Decisión documentada**: la extensión asume que el usuario ya tiene
  sesión iniciada en OneNote Web y Gmail en el navegador.
- **Evidencia**: `public/manifest.json` declara
  `host_permissions` para `*.onenote.com`, `*.office.com`,
  `*.officeapps.live.com`, `*.sharepoint.com`, `onedrive.live.com`,
  `mail.google.com`. La inyección de scripts en esos hosts requiere
  que el navegador los permita (lo cual presupone sesión iniciada).

### F3 — El manifiesto es la frontera de seguridad

- **Decisión documentada**: la lista de hosts del manifiesto es la
  única frontera de seguridad enforced por el navegador; la extensión
  no añade comprobaciones adicionales.
- **Evidencia**: `chrome.scripting.executeScript` fallará si la pestaña
  activa no está en `host_permissions`; `chrome.tabs.create` puede
  apuntar a cualquier URL, pero el content script de Gmail solo se
  ejecuta en `mail.google.com/*`.

### F4 — El bus de mensajes está tipado pero no autenticado

- **Decisión documentada**: `chrome.runtime.onMessage` no verifica
  remitente; cualquier content script de la propia extensión puede
  enviar mensajes al background.
- **Evidencia**: `src/background/index.ts:179` registra
  `chrome.runtime.onMessage.addListener` sin validar `_sender`; los
  content scripts envían al background asumiendo que es el suyo.
- **Riesgo implícito**: cualquier extensión maliciosa con el mismo
  `externally_connectable` (no configurado aquí) no podría enviar, pero
  sí podría si se modificara el manifiesto en el futuro.

### F5 — Migración de configuración heredada es idempotente

- **Decisión documentada**: la migración se aplica en cada lectura pero
  es no-op si no hay campos heredados.
- **Evidencia**: `migrateLegacyTemplateOverride` (en
  `src/utils/config.ts:24-50`) retorna `existingOverrides` cuando
  ningún campo legacy está presente; en caso contrario, mezcla los
  campos legacy bajo `templateOverrides[defaultTemplateId]`.

### F6 — Inserción en Gmail con espera acotada

- **Decisión documentada**: la inserción espera como máximo ~20
  segundos (20 reintentos × 1s) antes de fallar.
- **Evidencia**: `src/background/index.ts:158` invoca
  `sendMessageToTab(gmailTab.id, message, 20, 1000)`;
  `src/utils/helpers/chrome.ts:12-29` implementa el bucle de reintentos.

### F7 — Eliminación de firma solo para marcado estándar

- **Decisión documentada**: el removedor de firma solo maneja los
  selectores `.gmail_signature` y `[data-smartmail='gmail_signature']`.
- **Evidencia**: `src/utils/dom.ts:64-66` ejecuta
  `element.querySelector<HTMLElement>(".gmail_signature, [data-smartmail='gmail_signature']")`.

### F8 — Siempre se crea una nueva pestaña de Gmail

- **Decisión documentada**: cada invocación abre una nueva pestaña con
  `config.mailUrl`; no se reusan pestañas existentes.
- **Evidencia**: `src/background/index.ts:133` invoca
  `chrome.tabs.create({ url: config.mailUrl, active: true })` sin
  comprobación previa.

### F9 — El popup puede cerrarse durante la generación

- **Decisión documentada**: si el popup se cierra mientras el
  background procesa, las llamadas asíncronas del background se
  completan igualmente; los logs del popup se pierden.
- **Evidencia**: el popup hace `await chrome.runtime.sendMessage(...)`;
  al desmontarse el componente React, el resultado se descarta. El
  background ya ha disparado `chrome.tabs.create` y
  `chrome.tabs.sendMessage` antes de responder.

### F10 — Pruebas sin framework

- **Decisión documentada**: las pruebas son scripts Node puros con
  `node:assert/strict`; bundlean TypeScript con esbuild a
  `tests/.tmp/`.
- **Evidencia**: `tests/onenote-ticket-metadata.test.mjs:13-31` usa
  `await build({ stdin: { ... }, bundle: true, platform: "node", ... })`;
  `tests/onenote-level-hints.test.mjs:147-148` reimplementa la
  función bajo prueba como JS plano para comparar resultados sin
  cargar TypeScript en runtime.

## Conclusiones

- El modelo de confianza es robusto dentro de sus premisas (sesión
  del navegador + lista de hosts), pero NO DEBE extenderse sin
  documentar nuevas superficies de ataque (p. ej., aceptar mensajes de
  orígenes externos, ampliar `host_permissions`).
- La ingeniería inversa confirma que la especificación
  (`spec.md`) refleja fielmente el comportamiento del código para los
  flujos documentados, salvo por los siguientes matices aclarados en
  la sesión de clarificación del 2026-06-23:
  - Migración de configuración heredada: idempotente en cada lectura.
  - Inserción en Gmail: ~20s de presupuesto (no documentado en spec
    por decisión del usuario durante la clarificación).
  - Popup cerrado durante generación: borrador se inserta, logs se
    pierden.
  - Gmail ya abierto en otra pestaña: siempre se crea nueva pestaña.
  - Firma de Gmail con marcado distinto: no se elimina; puede
    requerir borrado manual.