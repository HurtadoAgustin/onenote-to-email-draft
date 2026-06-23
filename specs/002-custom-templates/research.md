# Investigación: Decisiones Técnicas para Plantillas Personalizadas

**Funcionalidad**: 002-custom-templates
**Fecha**: 2026-06-23
**Spec**: [spec.md](spec.md)

## Objetivo

Documentar las decisiones técnicas adoptadas para implementar la
funcionalidad de plantillas personalizadas, basándose en el análisis
del código existente en `src/`, `public/manifest.json`,
`scripts/build-extension.mjs`, `vite.config.ts` y `tsconfig.json`.

## Metodología

1. Revisión del estado actual del tipado y la configuración de
   plantillas en `src/utils/types.ts` y `src/utils/config.ts`.
2. Revisión del flujo de selección de plantilla en el popup y en el
   background.
3. Revisión de la página de opciones y sus patrones de UI.
4. Análisis de impacto de los cambios sobre el manifiesto, los
   bundles y las pruebas existentes.

## Decisiones

### D1 — Cambio de tipo `EmailTemplateId` de union a `string`

- **Decisión**: reemplazar
  `type EmailTemplateId = "estimation" | "scope" | "completedQa"`
  por `type EmailTemplateId = string`.
- **Rationale**: las plantillas personalizadas tienen IDs arbitrarios
  (UUIDs); un union de literales limitaría el tipo a tres valores y
  haría falta un tipo "any" o una segunda unión que complicaría
  consumidores. La solución más simple y consistente con el estilo
  actual es ampliar a `string`.
- **Impacto**:
  - El literal `"estimation"` (usado como `defaultTemplateId`) sigue
    siendo válido.
  - `migrateLegacyTemplateOverride` accede por clave a
    `existingOverrides[defaultTemplateId]`, lo que sigue funcionando
    sin cambios.
  - `getEmailTemplateForConfig(templateId, overrides)` mantiene su
    firma; el fallback a `estimation` se conserva.
  - Se reduce la garantía de tipo (ya no es detectable por el
    compilador si se pasa un ID inválido), pero el código defensivo
    ya lo cubría (`?? estimationTemplate`).
- **Alternativas consideradas**:
  - Mantener union + tipo compuesto (`type AnyId = EmailTemplateId |
    \`custom-\${string}\``): rechazado por verbosidad y porque
    obligaría a validar el prefijo en cada llamada.
  - Union dinámica con template literal types sobre `as const`: no
    aporta valor práctico y complica el tipado.

### D2 — Nuevo campo `customTemplates: EmailTemplate[]` en `ExtensionConfig`

- **Decisión**: añadir un campo opcional en `ExtensionConfig`,
  poblado por defecto a `[]` en `defaultConfig`, y rellenado con `[]`
  en `getConfig` si está ausente.
- **Rationale**: el merge defensivo en `getConfig` ya usa spreads;
  basta con añadir `customTemplates: savedConfig?.customTemplates ??
  defaultConfig.customTemplates`. Esto cumple FR-002 (persistencia en
  el mismo almacenamiento) y FR-012 (tolerar esquema inválido).
- **Impacto**:
  - `saveConfig` persiste toda la config, así que
    `customTemplates` queda persistido sin cambios.
  - El merge cubre configs antiguas que no tengan el campo.
  - El tipo `EmailTemplate` ya existe; no se necesita un nuevo tipo
    (`CustomEmailTemplate` queda como alias documentado).
- **Alternativas consideradas**:
  - Almacenar en una clave separada de `chrome.storage.local`
    (`customTemplates: EmailTemplate[]` con su propia clave):
    rechazado porque el usuario espera una sola acción de guardado
    (**Save** persiste todo) y el aislamiento por claves añade
    complejidad innecesaria.
  - Almacenar en IndexedDB: rechazado por simplicidad (la cuota de
    `chrome.storage.local` es suficiente para textos cortos).

### D3 — Helper `getAvailableEmailTemplates(config)` en el registry

- **Decisión**: añadir un nuevo helper
  `getAvailableEmailTemplates(config): EmailTemplate[]` que concatene
  `emailTemplates` (built-in) con `config.customTemplates`.
- **Rationale**: el popup necesita la lista combinada; centralizar
  la combinación en el registry evita duplicar la lógica en cada
  consumidor.
- **Impacto**:
  - El popup importa `getAvailableEmailTemplates` y reemplaza el uso
    directo de `emailTemplates`.
  - El background puede usar el mismo helper al resolver plantillas.
  - El `getEmailTemplate` actual (por ID) sigue funcionando para
    built-ins; la búsqueda en `customTemplates` se hace cuando el ID
    no se encuentra entre los built-ins.
- **Alternativas consideradas**:
  - Modificar `getEmailTemplate` para que reciba config: rechazado
    porque rompe la firma existente y obliga a todos los consumidores
    a pasar la config. Mantener un helper separado y usar composición
    es más limpio.

### D4 — `crypto.randomUUID()` para IDs de plantillas personalizadas

- **Decisión**: usar `crypto.randomUUID()` para generar el `id` de
  cada plantilla personalizada.
- **Rationale**: API estándar del navegador, ya disponible en
  Chrome/Edge MV3 (el target del build es `chrome114`). Genera UUID
  v4 con entropía criptográfica; la probabilidad de colisión es
  despreciable.
- **Impacto**:
  - No se añade dependencia.
  - No requiere manifest changes.
  - El `EmailTemplate.id` ya es `string`; no se cambian tipos.
- **Alternativas consideradas**:
  - `Math.random()` + timestamp: rechazado por menor entropía y
    mayor probabilidad de colisión.
  - Librería `uuid`: rechazado por dependencia innecesaria.

### D5 — Validación de campos obligatorios solo en el guardado

- **Decisión**: validar `label !== ""` y `subjectTemplate !== ""`
  en el handler de **Save** de la página de opciones; no validar en
  el almacenamiento ni en el popup.
- **Rationale**: FR-010 y FR-011 requieren rechazar label o subject
  vacíos, pero permitir body vacío. El lugar natural para aplicar la
  validación es el momento del guardado, con un mensaje claro en la
  UI.
- **Impacto**:
  - La página de opciones muestra un error si la validación falla.
  - El popup y el background toleran plantillas con campos vacíos
    (sustitución por string vacío en el render), cumpliendo FR-012.
- **Alternativas consideradas**:
  - Validar también en el background: redundante y complica el
    manejo de errores.
  - Validar al crear la entrada: rechazado porque el usuario puede
    querer empezar con label vacío y rellenarlo antes de guardar.

### D6 — Página de opciones como única vía de gestión

- **Decisión**: crear, editar y eliminar plantillas personalizadas
  ocurre exclusivamente en la página de opciones. El popup solo
  permite seleccionarlas.
- **Rationale**: NFR-005 lo exige explícitamente; el popup tiene
  espacio limitado y la página de opciones ya tiene el patrón de
  editor por plantilla.
- **Impacto**:
  - `src/options/main.tsx` añade una nueva sección.
  - `src/popup/main.tsx` solo necesita listar y seleccionar.
- **Alternativas consideradas**:
  - Crear plantillas desde el popup: rechazado por NFR-005 y porque
    la UI del popup es demasiado estrecha.

### D7 — Sin botón **Restore** para plantillas personalizadas

- **Decisión**: la página de opciones NO muestra un botón
  **Restore** para plantillas personalizadas. El botón
  **Restore selected template** existente sigue disponible solo
  para plantillas integradas.
- **Rationale**: FR-005 y SC-006 lo exigen: las plantillas
  personalizadas son íntegramente del usuario y no tienen un
  original desde el que restaurar.
- **Impacto**:
  - La lógica de render del botón **Restore** debe condicionarse al
    tipo de plantilla seleccionada.
  - Si la plantilla seleccionada es custom, el botón se oculta.
- **Alternativas consideradas**:
  - Mostrar el botón deshabilitado: rechazado porque podría
    confundir al usuario sobre la existencia de la función.
  - Etiquetarlo como "Restore to empty": rechazado por alejarse del
    comportamiento solicitado.

### D8 — Mantener `changeOrderDocumentationProfile` para custom

- **Decisión**: las plantillas personalizadas usan
  `changeOrderDocumentationProfile` (el mismo perfil que las
  integradas).
- **Rationale**: el parser solo conoce este perfil; cualquier otra
  documentación no se parsearía correctamente. NFR-005 del spec
  001 ya establece que solo hay un perfil en uso.
- **Impacto**:
  - `CustomEmailTemplate.documentationProfile` apunta siempre a
    `changeOrderDocumentationProfile`.
  - No se expone un editor de perfil en la UI.
- **Alternativas consideradas**:
  - Permitir al usuario elegir o definir un perfil: rechazado por
    alcance (el parser no soportaría perfiles adicionales sin
    cambios profundos) y porque el spec no lo pide.

### D9 — `getEmailTemplateForConfig` resuelve custom por búsqueda secundaria

- **Decisión**: en `src/background/index.ts` y en
  `src/templateRegistry/index.ts`, el resolver de plantillas
  comprueba primero el conjunto de plantillas integradas (built-in)
  y, si no encuentra coincidencia, busca en
  `config.customTemplates`.
- **Rationale**: la búsqueda integrada debe seguir siendo
  preferente para mantener la semántica actual de
  `templateOverrides`; las plantillas personalizadas son aditivas.
- **Impacto**:
  - El background necesita acceso a la config (ya la tiene) para
    buscar en `customTemplates`.
  - La función `getEmailTemplateForConfig` puede aceptar config
    completa o solo `customTemplates` (decisión de diseño pendiente
    en tasks).
- **Alternativas consideradas**:
  - Concatenar siempre built-in + custom en un único array: válido,
    pero el helper de combinación (D3) ya cubre el caso del popup; el
    background puede usar el mismo helper o pasar config.

### D10 — Sin pruebas nuevas obligatorias

- **Decisión**: las pruebas existentes (`tests/*.test.mjs`)
  permanecen sin cambios; las nuevas pruebas son opcionales y se
  centran en el helper de combinación y la validación.
- **Rationale**: el principio V de la constitución (Pure-Node
  Assertion Tests) establece que las pruebas son `.test.mjs` con
  `node:assert/strict`; se pueden añadir tests nuevos siguiendo esa
  convención, pero no son obligatorios para esta funcionalidad.
- **Impacto**:
  - El plan no genera tests nuevos; queda para la fase de tasks.
  - Las pruebas existentes siguen pasando sin cambios.
- **Alternativas consideradas**:
  - Añadir tests obligatorios: rechazado por no estar en el spec.

## Conclusiones

- El cambio es totalmente aditivo: el campo `customTemplates` se
  añade sin migrar datos existentes.
- El cambio de tipo `EmailTemplateId = string` es la única
  modificación "invasiva" del código existente, y se mitiga con
  defaults conservadoras.
- El stack, los bundles, el manifiesto, las pruebas y la constitución
  no se modifican.
- El usuario obtiene un flujo coherente con el resto de la
  extensión: gestión en opciones, selección en popup, generación en
  background, persistencia en `chrome.storage.local`.