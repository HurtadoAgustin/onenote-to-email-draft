---

description: "Lista de tareas para verificar, documentar y completar la funcionalidad existente del modelo de confianza de autenticación"
---

# Tareas: Documentación del Modelo de Confianza de Autenticación

**Entrada**: Documentos de diseño desde `/specs/001-auth-trust-model/`
**Prerrequisitos**: `plan.md` (requerido), `spec.md` (requerido), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Pruebas**: las pruebas existentes (`tests/*.test.mjs`) forman parte de los criterios de aceptación de cada historia; no se generan pruebas nuevas.

**Organización**: las tareas se agrupan por historia de usuario (P1, P2, P3) para permitir verificación y completado independiente de cada flujo documentado.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: ejecutable en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: a qué historia de usuario pertenece la tarea (p. ej. [US1], [US2], [US3], [US4]).
- Las tareas incluyen rutas de archivo exactas.

## Convenciones de rutas

- **Proyecto único**: `src/`, `tests/` en la raíz del repositorio.
- Las rutas mostradas asumen proyecto único — se ajustan a `plan.md` estructura.

---

## Fase 1: Setup (Verificación de Infraestructura)

**Objetivo**: confirmar que la infraestructura del proyecto coincide con la declarada en `plan.md` y la constitución.

- [ ] T001 [P] Verificar que la estructura de `src/`, `tests/`, `public/`, `scripts/` coincide con la sección "Project Structure" de plan.md
- [ ] T002 [P] Verificar que `package.json` declara las dependencias listadas en plan.md (react, react-dom, vite, @vitejs/plugin-react, typescript, esbuild, @types/chrome, @types/node, @types/react, @types/react-dom)
- [ ] T003 [P] Verificar que `tsconfig.json` cumple el principio III: `strict: true`, `module: ESNext`, `moduleResolution: Bundler`, `jsx: react-jsx`, `allowJs: false`, `types: [chrome, node]`
- [ ] T004 [P] Verificar que `vite.config.ts` declara entradas multipágina para `popup.html` y `options.html` con `outDir: dist`
- [ ] T005 [P] Verificar que `scripts/build-extension.mjs` produce `dist/background/index.js` (ESM), `dist/content/onenote.js` y `dist/content/gmail.js` (IIFE) con `target: chrome114`
- [ ] T006 [P] Verificar que `public/manifest.json` declara `manifest_version: 3`, host_permissions para la familia OneNote y `mail.google.com`, y permisos `storage`, `tabs`, `scripting`

---

## Fase 2: Foundational (Puertas Estáticas)

**Objetivo**: ejecutar las puertas estáticas del proyecto antes de validar las historias de usuario.

- [ ] T007 [P] Ejecutar `npm run typecheck` desde la raíz y confirmar que termina con código 0 y sin errores
- [ ] T008 [P] Ejecutar `node tests/onenote-ticket-metadata.test.mjs` y confirmar que imprime `PASS: OneNote ticket metadata and ticket URL are parsed and rendered.`
- [ ] T009 [P] Ejecutar `node tests/onenote-level-hints.test.mjs` y confirmar que imprime `PASS: OneNote DOM rectLeft grouping detects nested list levels.`
- [ ] T010 [P] Ejecutar `npm run build` y confirmar que `dist/` contiene `popup.html`, `options.html`, `manifest.json`, `background/index.js`, `content/onenote.js`, `content/gmail.js` y los assets JS/CSS con hash

---

## Fase 3: Historia de Usuario 1 — Activar la extensión en una pestaña de OneNote (Prioridad: P1) 🎯 MVP

**Objetivo**: verificar que la extracción de OneNote y el rechazo de pestañas no-OneNote se comportan como está documentado en `spec.md` (US1).

**Prueba independiente**: ejecutar el escenario 1, 2 y 3 de `quickstart.md` y comparar con los resultados esperados.

### Implementación de US1

- [ ] T011 [P] [US1] Verificar que `src/popup/main.tsx` envía el mensaje `GENERATE_GMAIL_DRAFT` con `templateId` mediante `chrome.runtime.sendMessage` sin pedir credenciales
- [ ] T012 [P] [US1] Verificar que `src/background/index.ts` resuelve la plantilla llamando a `getEmailTemplateForConfig(templateId, config.templateOverrides)` desde `src/templateRegistry/index.ts`
- [ ] T013 [P] [US1] Verificar que `src/utils/helpers/onenoteExtraction.ts` invoca `chrome.scripting.executeScript` con `target: { tabId, allFrames: true }` y la función inyectada devuelve `{ url, title, text, domTextItems }`
- [ ] T014 [P] [US1] Verificar que la función inyectada en `onenoteExtraction.ts` descarta nodos con `display: none`, `visibility: hidden` o color rojizo, y que combina texto de múltiples frames deduplicando
- [ ] T015 [P] [US1] Verificar que `src/background/index.ts` rechaza la operación con un mensaje `❌ Active tab not found` cuando `getActiveTab()` devuelve `null`
- [ ] T016 [US1] Documentar en `spec.md` (sección US1) cualquier matiz del comportamiento real de la extracción que no esté capturado (texto inyectado, filtrado de color, deduplicación por frame)
- [ ] T017 [US1] Validar manualmente el escenario 1 de `quickstart.md` (pestaña OneNote válida) y registrar el resultado en una nota del commit

---

## Fase 4: Historia de Usuario 2 — Componer un borrador de Gmail para revisión manual (Prioridad: P1)

**Objetivo**: verificar que el flujo de apertura de Gmail e inserción del borrador coincide con `spec.md` (US2) y el contrato `contracts/chrome-runtime-messages.md`.

**Prueba independiente**: ejecutar los escenarios 4, 5, 6, 9 y 10 de `quickstart.md` y comparar con los resultados esperados.

### Implementación de US2

- [ ] T018 [P] [US2] Verificar que `src/background/index.ts` invoca `chrome.tabs.create({ url: config.mailUrl, active: true })` sin comprobar pestañas existentes de Gmail
- [ ] T019 [P] [US2] Verificar que `src/utils/helpers/chrome.ts` implementa `sendMessageToTab` con bucle de reintentos (`retries=20`, `retryDelayMs=1000`) y que `background/index.ts` lo invoca con esos valores para la inserción en Gmail
- [ ] T020 [P] [US2] Verificar que `src/content/gmail.ts` invoca `waitForElement<HTMLElement>(composeSelector, 20000)` con el selector `config.selectors.gmailComposeDialog` o `div[role='dialog']` por defecto
- [ ] T021 [P] [US2] Verificar que `src/content/gmail.ts` selecciona el último cuadro de composición con `findLatestComposeDialog` (último elemento en orden del DOM)
- [ ] T022 [P] [US2] Verificar que `src/utils/dom.ts:insertHtmlIntoContentEditable` elimina el primer match de `.gmail_signature` o `[data-smartmail='gmail_signature']` antes de asignar `innerHTML`
- [ ] T023 [P] [US2] Verificar que `src/utils/dom.ts:insertHtmlIntoContentEditable` dispara `InputEvent("input", { bubbles: true, cancelable: true })` tras la asignación
- [ ] T024 [P] [US2] Verificar que `src/utils/dom.ts:setNativeInputValue` usa `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set` para que el cambio sea detectado por el editor de Gmail
- [ ] T025 [US2] Documentar en `spec.md` (edge cases) el comportamiento de popup cerrado durante la generación, Gmail ya abierto en otra pestaña y firma con marcado no estándar
- [ ] T026 [US2] Validar manualmente los escenarios 4, 5, 6, 9 y 10 de `quickstart.md` y registrar el resultado en una nota del commit

---

## Fase 5: Historia de Usuario 3 — Configurar la extensión localmente (Prioridad: P2)

**Objetivo**: verificar que la página de opciones y la persistencia de configuración cumplen `spec.md` (US3) y el contrato `contracts/chrome-storage-config.md`.

**Prueba independiente**: ejecutar el escenario 7 de `quickstart.md` y validar manualmente la persistencia.

### Implementación de US3

- [ ] T027 [P] [US3] Verificar que `src/utils/config.ts:defaultConfig` contiene los valores declarados en `contracts/chrome-storage-config.md` (mailUrl, ticketUrlTemplate, selectores por defecto, `flags.allowIncompleteFields: true`)
- [ ] T028 [P] [US3] Verificar que `src/options/main.tsx` carga la configuración en `useEffect` invocando `getConfig()` y poblando los estados locales
- [ ] T029 [P] [US3] Verificar que `src/options/main.tsx:save` invoca `saveConfig(updatedConfig)` y muestra el estado `✅ Settings saved` tras la persistencia
- [ ] T030 [P] [US3] Verificar que `src/options/main.tsx:reset` invoca `resetConfig()` y muestra `✅ Settings restored`
- [ ] T031 [P] [US3] Verificar que `src/options/main.tsx:resetSelectedTemplate` elimina solo el override de la plantilla seleccionada del objeto `templateOverrides` antes de guardar
- [ ] T032 [US3] Documentar en `spec.md` (US3) el ciclo de vida exacto de `ExtensionConfig`: carga → defaults → migración → uso → guardado → restauración
- [ ] T033 [US3] Validar manualmente el escenario 7 de `quickstart.md` y registrar el resultado en una nota del commit

---

## Fase 6: Historia de Usuario 4 — Conservar y migrar configuración entre formatos heredados (Prioridad: P3)

**Objetivo**: verificar que la migración de configuración heredada cumple `spec.md` (US4) y la sección de migración de `contracts/chrome-storage-config.md`.

**Prueba independiente**: ejecutar el escenario 8 de `quickstart.md` y validar la idempotencia con una segunda lectura.

### Implementación de US4

- [ ] T034 [P] [US4] Verificar que `src/utils/config.ts:migrateLegacyTemplateOverride` retorna `existingOverrides` sin cambios cuando ningún campo legacy (`subjectTemplate`, `bodyTemplate`, `fieldMappings`) está presente
- [ ] T035 [P] [US4] Verificar que la migración coloca los campos legacy presentes dentro de `existingOverrides[defaultTemplateId]` (donde `defaultTemplateId = "estimation"`) y los omite del objeto raíz
- [ ] T036 [P] [US4] Verificar que `getConfig()` aplica la migración en cada lectura (la idempotencia viene de la no-op cuando no hay campos legacy)
- [ ] T037 [US4] Validar manualmente el escenario 8 de `quickstart.md` y verificar la idempotencia ejecutando una segunda lectura
- [ ] T038 [US4] Confirmar que `spec.md` (sección Clarifications, sesión 2026-06-23, primera entrada) refleja la idempotencia de la migración

---

## Fase 7: Polish & Cross-Cutting Concerns

**Objetivo**: validar propiedades transversales del modelo de confianza y mantener la coherencia entre especificación, constitución e implementación.

- [ ] T039 [P] Verificar que no existen llamadas a `fetch`, `XMLHttpRequest`, `WebSocket`, `chrome.identity`, `chrome.cookies` ni `chrome.webRequest` en `src/` (consistente con NFR-001)
- [ ] T040 [P] Verificar que `chrome.runtime.onMessage` en `src/background/index.ts`, `src/content/onenote.ts` y `src/content/gmail.ts` no autentican el remitente (consistente con FR-003 y el modelo de confianza)
- [ ] T041 [P] Verificar que `specs/001-auth-trust-model/checklists/requirements.md` sigue marcando los 16 ítems como `[x]` tras las verificaciones de las fases previas
- [ ] T042 [P] Verificar que `AGENTS.md` apunta al plan activo (`specs/001-auth-trust-model/plan.md`)
- [ ] T043 [P] Verificar que `.specify/memory/constitution.md` (v1.0.1) sigue alineada con el comportamiento real del código (sin secciones obsoletas)
- [ ] T044 [P] Verificar que `README.md` no contradice la constitución ni el spec (descripción del MVP, sin backend, sin IA, persistencia local)
- [ ] T045 [P] Verificar que la constitución principios I–V siguen cumpliéndose tras las verificaciones (verificación cruzada con la tabla de Constitution Check de `plan.md`)

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- **Setup (Fase 1)**: sin dependencias; puede iniciarse de inmediato.
- **Foundational (Fase 2)**: depende de la finalización de Setup — BLOQUEA todas las historias de usuario.
- **Historias de Usuario (Fases 3–6)**: dependen de la finalización de Foundational.
  - HU1, HU2, HU3, HU4 pueden ejecutarse en paralelo tras Foundational.
  - HU1 y HU2 son interdependientes a nivel de runtime (HU2 depende de los datos que HU1 produce), pero las verificaciones son independientes en el código.
  - HU3 y HU4 son independientes entre sí y de HU1/HU2.
- **Polish (Fase 7)**: depende de la finalización de las historias de usuario que se decida verificar.

### Dependencias dentro de Cada Historia

- Verificación de archivos de implementación → Documentación de matices en spec → Validación manual de quickstart.
- Las tareas de verificación de archivos pueden ejecutarse en paralelo (cada una toca un archivo distinto).

### Oportunidades de Paralelización

- Todas las tareas de Fase 1 marcadas con `[P]` (infraestructura) son paralelas entre sí.
- Todas las tareas de Fase 2 marcadas con `[P]` (puertas estáticas) son paralelas entre sí.
- Una vez completada Fase 2, las historias de usuario (Fases 3–6) pueden verificarse en paralelo.
- Las tareas de Fase 7 marcadas con `[P]` (verificaciones cruzadas) son paralelas entre sí.

---

## Ejemplos de Paralelización

### Verificaciones paralelas de Fase 1 (infraestructura)

```bash
# Lanzar todas las verificaciones de archivos de configuración juntas:
Task: "T001 Verificar estructura de src/, tests/, public/, scripts/"
Task: "T002 Verificar package.json"
Task: "T003 Verificar tsconfig.json"
Task: "T004 Verificar vite.config.ts"
Task: "T005 Verificar scripts/build-extension.mjs"
Task: "T006 Verificar public/manifest.json"
```

### Verificaciones paralelas de Fase 3 (US1)

```bash
# Lanzar todas las verificaciones de archivos de US1 juntas:
Task: "T011 Verificar src/popup/main.tsx"
Task: "T012 Verificar src/background/index.ts"
Task: "T013 Verificar src/utils/helpers/onenoteExtraction.ts"
Task: "T014 Verificar filtrado de color/visibilidad en onenoteExtraction.ts"
Task: "T015 Verificar rechazo de pestaña no-OneNote en background/index.ts"
```

### Validaciones paralelas de Fase 7 (polish)

```bash
# Lanzar todas las verificaciones cruzadas juntas:
Task: "T039 Verificar ausencia de fetch/XHR/WebSocket en src/"
Task: "T040 Verificar que onMessage no autentica remitente"
Task: "T041 Verificar spec checklist"
Task: "T042 Verificar AGENTS.md"
Task: "T043 Verificar constitución v1.0.1"
Task: "T044 Verificar README.md"
Task: "T045 Verificar constitution check de plan.md"
```

---

## Estrategia de Implementación

### MVP (US1 solamente)

1. Completar Fase 1: Setup.
2. Completar Fase 2: Foundational.
3. Completar Fase 3: US1.
4. **STOP y VALIDAR**: ejecutar T017 (validación manual del escenario 1) y registrar el resultado.
5. Si el escenario 1 produce el resultado esperado, US1 está verificado.

### Entrega Incremental

1. Setup + Foundational → infraestructura verificada.
2. US1 → comportamiento de extracción verificado y documentado.
3. US2 → comportamiento de inserción en Gmail verificado y documentado.
4. US3 → comportamiento de opciones verificado y documentado.
5. US4 → comportamiento de migración verificado y documentado.
6. Polish → verificaciones cruzadas, alineación con constitución y spec.

### Estrategia de Equipo Paralelo

Con varios verificadores:

1. El equipo completa Setup + Foundational juntos.
2. Una vez Foundational listo:
   - Verificador A: Fase 3 (US1) + T016/T017.
   - Verificador B: Fase 4 (US2) + T025/T026.
   - Verificador C: Fase 5 (US3) + T032/T033.
   - Verificador D: Fase 6 (US4) + T037/T038.
3. Las historias se completan y verifican independientemente.

---

## Alcance MVP Sugerido

**MVP = US1 (P1)**: verificar que la extracción de OneNote y el rechazo de pestañas no-OneNote funcionan como está documentado. Es la entrada del flujo del MVP original y desbloquea HU2 (inserción en Gmail), que comparte la misma prioridad P1.

Las historias HU3 (P2) y HU4 (P3) son complementarias y pueden entregarse de forma incremental tras el MVP.

---

## Notas

- Las tareas marcadas con `[P]` son paralelas entre sí; las demás tienen dependencias secuenciales dentro de su fase.
- La etiqueta `[USx]` mapea cada tarea a la historia de usuario correspondiente para trazabilidad.
- Cada tarea es ejecutable por un LLM sin contexto adicional: la descripción incluye el archivo y el comportamiento esperado.
- Las tareas de validación manual (`T017`, `T026`, `T033`, `T037`) requieren interacción con un navegador real con la extensión cargada; deben documentar el resultado en una nota del commit.
- Las tareas de documentación en `spec.md` (T016, T025, T032, T038) son opcionales si las verificaciones confirman que el spec ya captura el comportamiento real; en caso contrario, registran la divergencia detectada.
- Evitar: tareas vagas, conflictos sobre el mismo archivo entre tareas paralelas, dependencias entre historias que rompan la verificabilidad independiente.