---

description: "Lista de tareas para implementar la funcionalidad de plantillas personalizadas de correo"
---

# Tareas: Plantillas Personalizadas de Correo

**Entrada**: Documentos de diseño desde `/specs/002-custom-templates/`
**Prerrequisitos**: `plan.md` (requerido), `spec.md` (requerido), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Pruebas**: el plan (D10) declara que las pruebas nuevas no son obligatorias; se añade un test focalizado para el nuevo helper (`tests/custom-template.test.mjs`) siguiendo la convención del proyecto (principio V de la constitución).

**Organización**: las tareas se agrupan por historia de usuario (P1, P2) para permitir implementación y verificación independiente de cada flujo.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: ejecutable en paralelo (sin dependencias pendientes con otras tareas [P] del mismo lote).
- **[Story]**: a qué historia de usuario pertenece la tarea (p. ej. [US1], [US2], [US3], [US4], [US5]).
- Las tareas incluyen rutas de archivo exactas.

## Convenciones de rutas

- **Proyecto único**: `src/`, `tests/` en la raíz del repositorio.
- Las rutas mostradas asumen proyecto único — se ajustan a `plan.md` estructura.

---

## Fase 1: Setup (Verificación de Documentos)

**Objetivo**: confirmar que los artefactos de diseño están completos y la constitución sigue alineada.

- [ ] T001 [P] Verificar que `specs/002-custom-templates/spec.md` contiene todas las secciones obligatorias (Resumen Ejecutivo, Escenarios de Usuario, Requisitos, Criterios de Éxito, Suposiciones)
- [ ] T002 [P] Verificar que `specs/002-custom-templates/plan.md` tiene la tabla de Constitution Check marcada como ✅ para los cinco principios
- [ ] T003 [P] Verificar que `.specify/memory/constitution.md` sigue en versión 1.0.1 y refleja los principios del proyecto

---

## Fase 2: Foundational (Cambios Estructurales)

**Objetivo**: aplicar los cambios de tipos, defaults y helpers que desbloquean todas las historias de usuario.

- [ ] T004 Modificar `src/utils/types.ts`: cambiar `EmailTemplateId` de union de literales a `string` y añadir `customTemplates: EmailTemplate[]` a `ExtensionConfig`
- [ ] T005 [P] Añadir `customTemplates: []` a `defaultConfig` en `src/utils/config.ts`
- [ ] T006 Añadir merge defensivo de `customTemplates` en `getConfig` (fallback a `[]` si el campo falta) en `src/utils/config.ts`
- [ ] T007 [P] Crear `src/utils/helpers/customTemplate.ts` con la función `createCustomTemplate()` que devuelve un objeto `EmailTemplate` con `id = crypto.randomUUID()` y `documentationProfile = changeOrderDocumentationProfile`
- [ ] T008 Añadir las funciones `validateCustomTemplate(template, existingIds)` y `isValidCustomTemplate(template)` a `src/utils/helpers/customTemplate.ts` (rechazo si `id` vacío/duplicado/colisión con built-in, `label` vacío, `subjectTemplate` vacío; body vacío permitido)
- [ ] T009 [P] Añadir `getAvailableEmailTemplates(config)` a `src/templateRegistry/index.ts` que concatena `emailTemplates` con `config.customTemplates`
- [ ] T010 [P] Crear `tests/custom-template.test.mjs` con aserciones para `createCustomTemplate` (forma, id UUID, defaults) y `validateCustomTemplate` (válido, label vacío, subject vacío, id duplicado, colisión con built-in, body vacío permitido)
- [ ] T011 Ejecutar `npm run typecheck` y confirmar que los cambios de tipo compilan sin errores antes de continuar con las historias

---

## Fase 3: Historia de Usuario 1 — Crear una plantilla personalizada (Prioridad: P1) 🎯 MVP

**Objetivo**: permitir al usuario crear plantillas personalizadas desde la página de opciones, validarlas y persistirlas.

**Prueba independiente**: ejecutar los escenarios 1, 2, 3 y 4 de `quickstart.md` y comparar con los resultados esperados.

### Implementación de US1

- [ ] T012 [P] [US1] Añadir nueva sección `<section className="card">` con título "Custom templates" y botón **Add custom template** en `src/options/main.tsx`
- [ ] T013 [P] [US1] Añadir estado local `const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>(config.customTemplates)` en `src/options/main.tsx` y renderizar la lista con un editor por entrada
- [ ] T014 [US1] Implementar el handler `addCustomTemplate` en `src/options/main.tsx` que invoca `createCustomTemplate()` y añade la entrada al estado local
- [ ] T015 [P] [US1] Añadir la llamada a `validateCustomTemplate` dentro del handler `save` existente en `src/options/main.tsx` para cada plantilla de la lista
- [ ] T016 [P] [US1] Mostrar mensaje de error claro (`status = "❌ ..."`) en la UI de opciones cuando `validateCustomTemplate` devuelve `{ ok: false }`
- [ ] T017 [US1] Extender el handler `save` para incluir `customTemplates: customTemplates` en el `updatedConfig` antes de invocar `saveConfig`
- [ ] T018 [US1] Verificar que una plantilla con `bodyTemplate` vacío se guarda correctamente (FR-011) y aparece en el popup
- [ ] T019 [US1] Validar manualmente los escenarios 1, 2, 3 y 4 de `quickstart.md` y registrar el resultado en una nota del commit

---

## Fase 4: Historia de Usuario 2 — Editar una plantilla personalizada existente (Prioridad: P1)

**Objetivo**: permitir al usuario modificar los campos de una plantilla personalizada y persistir los cambios.

**Prueba independiente**: ejecutar el escenario 5 de `quickstart.md` y verificar que la edición actualiza la misma entrada (no crea una nueva).

### Implementación de US2

- [ ] T020 [P] [US2] Implementar el handler `selectCustomTemplate(id)` en `src/options/main.tsx` que carga los campos de la plantilla seleccionada en los estados locales del editor
- [ ] T021 [P] [US2] Implementar los handlers de cambio para `label`, `description`, `subjectTemplate`, `bodyTemplate` y `fieldMappings` que actualizan la entrada correspondiente en el estado `customTemplates`
- [ ] T022 [US2] Verificar que editar y guardar actualiza la misma entrada en `chrome.storage.local` (mismo `id`, sin duplicar)
- [ ] T023 [US2] Validar manualmente el escenario 5 de `quickstart.md` y registrar el resultado en una nota del commit

---

## Fase 5: Historia de Usuario 3 — Eliminar una plantilla personalizada (Prioridad: P2)

**Objetivo**: permitir al usuario eliminar plantillas personalizadas desde la página de opciones, sin ofrecer la opción de "restaurar" para estas plantillas.

**Prueba independiente**: ejecutar los escenarios 6 y 7 de `quickstart.md` y verificar que la eliminación y la ocultación del botón Restore funcionan.

### Implementación de US3

- [ ] T024 [P] [US3] Añadir botón **Delete** por entrada de plantilla personalizada en `src/options/main.tsx`
- [ ] T025 [P] [US3] Implementar el handler `deleteCustomTemplate(id)` que elimina la entrada del estado local `customTemplates` en `src/options/main.tsx`
- [ ] T026 [US3] Verificar que la eliminación se persiste al pulsar **Save** y la plantilla ya no aparece en el popup tras la próxima apertura
- [ ] T027 [P] [US3] Ocultar el botón **Restore selected template** en `src/options/main.tsx` cuando la plantilla seleccionada es custom (FR-005, SC-006)
- [ ] T028 [US3] Validar manualmente los escenarios 6 y 7 de `quickstart.md` y registrar el resultado en una nota del commit

---

## Fase 6: Historia de Usuario 4 — Usar una plantilla personalizada para generar un borrador (Prioridad: P1)

**Objetivo**: permitir al usuario seleccionar y usar una plantilla personalizada desde el popup, resolviendo el ID tanto en built-in como en custom.

**Prueba independiente**: ejecutar el escenario 8 de `quickstart.md` y verificar que el borrador generado usa exclusivamente la plantilla personalizada seleccionada.

### Implementación de US4

- [ ] T029 [P] [US4] Cargar la configuración en el popup con `useEffect` invocando `getConfig()` en `src/popup/main.tsx` y almacenar el resultado en un estado local
- [ ] T030 [P] [US4] Reemplazar el uso directo de `emailTemplates` por `getAvailableEmailTemplates(config)` en el render del popup, manteniendo el filtro de plantillas inválidas (FR-012)
- [ ] T031 [P] [US4] Actualizar la resolución de plantilla en `src/background/index.ts`: tras `getEmailTemplateForConfig`, si el `id` no coincide, buscar en `config.customTemplates` por `id`; mantener el fallback a `estimation` si tampoco se encuentra
- [ ] T032 [P] [US4] Filtrar las plantillas personalizadas con esquema inválido (campos requeridos ausentes, tipos incorrectos) antes de renderizarlas en el popup, sin interrumpir la lista de las integradas
- [ ] T033 [US4] Validar manualmente el escenario 8 de `quickstart.md` y registrar el resultado en una nota del commit

---

## Fase 7: Historia de Usuario 5 — Las plantillas personalizadas sobreviven a recargas y reinicios (Prioridad: P2)

**Objetivo**: verificar la persistencia de las plantillas personalizadas entre recargas de la extensión y sesiones del navegador.

**Prueba independiente**: ejecutar el escenario 9 de `quickstart.md` (crear, recargar, reiniciar) y verificar que las plantillas siguen disponibles.

### Implementación de US5

- [ ] T034 [US5] Verificar que `saveConfig` en `src/utils/config.ts` persiste el array `customTemplates` completo bajo la clave `onenoteToMailDraftConfig` en `chrome.storage.local`
- [ ] T035 [US5] Verificar que `getConfig` recupera el array `customTemplates` correctamente en la siguiente lectura (incluyendo el merge defensivo a `[]` si el campo falta)
- [ ] T036 [US5] Validar manualmente el escenario 9 de `quickstart.md` (crear plantillas, recargar la extensión desde `chrome://extensions`, cerrar y reabrir el navegador) y registrar el resultado en una nota del commit

---

## Fase 8: Polish & Cross-Cutting Concerns

**Objetivo**: validar la integridad global de la feature, las pruebas, la constitución y los artefactos relacionados.

- [ ] T037 [P] Validar manualmente el escenario 10 de `quickstart.md` (inyectar plantilla con esquema inválido y verificar que el popup sigue funcional)
- [ ] T038 [P] Verificar que los cinco principios de la constitución siguen cumpliéndose tras los cambios (verificación cruzada con la tabla Constitution Check de `plan.md`)
- [ ] T039 [P] Verificar que el checklist de calidad del spec (`specs/002-custom-templates/checklists/requirements.md`) sigue marcando los 16 ítems como `[x]`
- [ ] T040 [P] Ejecutar `npm run typecheck` desde la raíz y confirmar que termina con código 0
- [ ] T041 [P] Ejecutar `npm run build` y confirmar que `dist/` contiene los artefactos esperados (`popup.html`, `options.html`, `manifest.json`, `background/index.js`, `content/onenote.js`, `content/gmail.js`, assets JS/CSS)
- [ ] T042 [P] Ejecutar todos los tests (`tests/custom-template.test.mjs`, `tests/onenote-ticket-metadata.test.mjs`, `tests/onenote-level-hints.test.mjs`) y confirmar que todos imprimen `PASS:`
- [ ] T043 [P] Verificar que `AGENTS.md` apunta al plan activo (`specs/002-custom-templates/plan.md`) entre los marcadores `<!-- SPECKIT START -->` y `<!-- SPECKIT END -->`

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- **Setup (Fase 1)**: sin dependencias; puede iniciarse de inmediato.
- **Foundational (Fase 2)**: depende de la finalización de Setup — BLOQUEA todas las historias de usuario.
  - T004 → T005/T006 (tipos antes que merge defensivo)
  - T007 → T008 (helper antes que validador en el mismo archivo)
  - T005 → T006 (default antes que merge en el mismo archivo)
  - T011 depende de T004–T010 (typecheck al final de la fase)
- **Historias de Usuario (Fases 3–7)**: dependen de la finalización de Foundational.
  - US1, US2, US3 están interrelacionadas en el mismo archivo (`src/options/main.tsx`); el orden US1 → US2 → US3 es natural porque US2 parte de la UI de US1 y US3 extiende ambas.
  - US4 (popup + background) puede avanzarse en paralelo con US2/US3 una vez Foundational está lista.
  - US5 (persistencia) depende de que T034/T035 verifiquen que saveConfig/getConfig ya manejan el array.
- **Polish (Fase 8)**: depende de la finalización de las historias de usuario que se decida implementar.

### Dependencias dentro de Cada Historia

- Crear UI (T012) → Estado local (T013) → Handler (T014) → Validación al guardar (T015) → Mensaje de error (T016) → Persistencia (T017) → Verificación de body vacío (T018) → Validación manual (T019).
- Las tareas marcadas con `[P]` no tienen dependencias entre sí dentro del mismo lote.

### Oportunidades de Paralelización

- **Fase 1**: 3 tareas paralelas sobre archivos distintos.
- **Fase 2**: T005, T007, T009, T010 son paralelas entre sí (archivos distintos).
- **Fase 3**: T012, T013, T015, T016 son paralelas dentro del mismo archivo pero en secciones distintas.
- **Fase 4**: T020, T021 son paralelas.
- **Fase 5**: T024, T025, T027 son paralelas en `src/options/main.tsx` pero en secciones distintas.
- **Fase 6**: T029, T030, T031, T032 son paralelas sobre archivos distintos.
- **Fase 8**: 7 tareas paralelas sobre verificaciones independientes.

---

## Ejemplos de Paralelización

### Verificaciones paralelas de Fase 1

```bash
# Lanzar las verificaciones de artefactos juntas:
Task: "T001 Verificar spec.md completo"
Task: "T002 Verificar plan.md Constitution Check"
Task: "T003 Verificar constitución v1.0.1"
```

### Cambios estructurales paralelos de Fase 2

```bash
# Lanzar los cambios en archivos distintos juntos:
Task: "T005 Añadir customTemplates a defaultConfig"
Task: "T007 Crear customTemplate.ts con createCustomTemplate()"
Task: "T009 Añadir getAvailableEmailTemplates al registry"
Task: "T010 Crear tests/custom-template.test.mjs"
```

### Implementación paralela de Fase 6 (popup + background)

```bash
# Lanzar los cambios en archivos distintos juntos:
Task: "T029 Cargar config con useEffect en popup"
Task: "T030 Usar getAvailableEmailTemplates en popup"
Task: "T031 Actualizar resolveTemplate en background"
Task: "T032 Filtrar plantillas inválidas en popup"
```

### Verificaciones paralelas de Fase 8

```bash
# Lanzar todas las verificaciones cruzadas juntas:
Task: "T037 Escenario 10 de quickstart.md"
Task: "T038 Constitution Check"
Task: "T039 Spec quality checklist"
Task: "T040 npm run typecheck"
Task: "T041 npm run build"
Task: "T042 Ejecutar todos los tests"
Task: "T043 Verificar AGENTS.md"
```

---

## Estrategia de Implementación

### MVP (US1 + US4 solamente)

1. Completar Fase 1: Setup.
2. Completar Fase 2: Foundational.
3. Completar Fase 3: US1 (crear plantilla en opciones).
4. Completar parcialmente Fase 6: US4 mínimo (cargar config en popup, combinar listas, resolver en background).
5. **STOP y VALIDAR**: ejecutar T019 (escenarios 1-4) y T033 (escenario 8) y registrar resultados.
6. Si las plantillas se crean y aparecen en el popup, el MVP está listo.

### Entrega Incremental

1. Setup + Foundational → cambios estructurales en su sitio.
2. US1 → crear plantilla funcional.
3. US2 → editar funcional.
4. US3 → eliminar + ocultar Restore.
5. US4 → usar plantilla desde popup.
6. US5 → verificar persistencia.
7. Polish → verificaciones cruzadas y constitución.

### Estrategia de Equipo Paralelo

Con varios implementadores:

1. El equipo completa Setup + Foundational juntos.
2. Una vez Foundational listo:
   - Implementador A: Fase 3 (US1) + Fase 4 (US2) + Fase 5 (US3) — todo en `src/options/main.tsx`.
   - Implementador B: Fase 6 (US4) — popup + background.
   - Implementador C: Fase 7 (US5) + verificaciones de persistencia.
3. Las historias se completan y verifican independientemente.

---

## Alcance MVP Sugerido

**MVP = US1 (P1) + US4 (P1)**: el usuario puede crear una plantilla personalizada desde opciones y usarla desde el popup. Las historias US2 (P1), US3 (P2) y US5 (P2) son complementarias y pueden entregarse de forma incremental tras el MVP.

---

## Notas

- Las tareas marcadas con `[P]` son paralelas entre sí; las demás tienen dependencias secuenciales dentro de su fase.
- La etiqueta `[USx]` mapea cada tarea a la historia de usuario correspondiente para trazabilidad.
- Cada tarea es ejecutable por un LLM sin contexto adicional: la descripción incluye el archivo y el comportamiento esperado.
- Las tareas de validación manual (`T019`, `T023`, `T028`, `T033`, `T036`, `T037`) requieren interacción con un navegador real con la extensión cargada; deben documentar el resultado en una nota del commit.
- El cambio de tipo `EmailTemplateId` de union a `string` (T004) es la única modificación "invasiva" del código existente; está mitigado por defaults conservadoras en `defaultConfig` y en el fallback de `getEmailTemplateForConfig`.
- El plan declara que las pruebas nuevas no son obligatorias; se añade `tests/custom-template.test.mjs` (T010) siguiendo la convención del proyecto, pero las pruebas unitarias adicionales para `getAvailableEmailTemplates` o la UI de opciones son opcionales.
- Evitar: tareas vagas, conflictos sobre el mismo archivo entre tareas paralelas, dependencias entre historias que rompan la verificabilidad independiente.