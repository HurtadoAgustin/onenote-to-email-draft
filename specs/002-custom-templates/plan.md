# Plan de Implementación: Plantillas Personalizadas de Correo

**Rama**: `[002-custom-templates]` | **Fecha**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Entrada**: Especificación de `/specs/002-custom-templates/spec.md`.

**Nota**: este plan describe la implementación de la nueva funcionalidad
de plantillas personalizadas, aprovechando el stack, los patrones y la
infraestructura existentes en el proyecto. No se proponen migraciones
ni cambios tecnológicos; los cambios son aditivos sobre el código
actual.

## Resumen

La extensión pasará a permitir que el usuario defina **plantillas de
correo personalizadas** íntegramente nuevas, las persista en el
almacenamiento local del navegador, y las use desde el popup igual que
las plantillas integradas. La gestión se realiza exclusivamente desde
la página de opciones, sin opción de "restaurar" para estas plantillas.

## Contexto Técnico

- **Lenguaje/Versión**: TypeScript estricto (target ES2020, jsx:
  `react-jsx`, `allowJs: false`); React 18+ con runtime automático de
  JSX; ESM (`"type": "module"`).
- **Dependencias principales**: las mismas declaradas en el plan del
  spec 001 (react, react-dom, vite, @vitejs/plugin-react, typescript,
  esbuild, @types/chrome, @types/node, @types/react, @types/react-dom).
  No se añaden dependencias nuevas.
- **API del navegador**: `crypto.randomUUID()` para generar IDs únicos
  de plantillas personalizadas (ya disponible en Chrome/Edge MV3).
- **Almacenamiento**: `chrome.storage.local` bajo la clave existente
  `onenoteToMailDraftConfig`; se añade un nuevo campo
  `customTemplates: EmailTemplate[]` con default `[]`.
- **Pruebas**: el mismo patrón existente (`tests/*.test.mjs` con
  `node:assert/strict` y bundle esbuild a `tests/.tmp/`). Se pueden
  añadir tests adicionales en archivos `.test.mjs` siguiendo la
  convención actual.
- **Plataforma objetivo**: Chrome (MV3, build target `chrome114`) y
  Edge (MV3). Sin cambios en el manifiesto.
- **Tipo de proyecto**: extensión de navegador (MV3); se reutilizan los
  tres bundles existentes (popup, options, background) y los dos
  content scripts.
- **Metas de rendimiento**: la creación + visibilidad en popup de una
  plantilla personalizada debe completarse en menos de 60 segundos
  (SC-001). El popup debe seguir siendo funcional aunque existan
  plantillas personalizadas con esquema inválido en el almacenamiento
  (SC-008).
- **Restricciones**: client-side only; sin backend, sin IA, sin red;
  TypeScript estricto; persistencia en `chrome.storage.local`.
- **Escala/Alcance**: por usuario; NFR-004 no impone límite arbitrario
  al número de plantillas personalizadas; el único límite es la cuota
  del almacenamiento local del navegador.

## Verificación de la Constitución

*PUERTA: Debe pasar antes de la Fase 0. Re-verificar tras la Fase 1.*

| Principio | Estado | Evidencia prevista |
|-----------|--------|--------------------|
| I. Solo del lado del cliente — sin backend, sin IA | ✅ Pasa | Toda la persistencia es en `chrome.storage.local`; `crypto.randomUUID()` es local. |
| II. Topología Manifest V3 | ✅ Pasa | No se modifica el manifiesto; se reutilizan los tres bundles y los dos content scripts. |
| III. TypeScript estricto, ESM, JSX automático | ✅ Pasa | Las nuevas declaraciones (campo `customTemplates`, helper de combinación, UI de opciones) usan `tsconfig.json` con `strict: true`. |
| IV. Generación dirigida por plantillas | ✅ Pasa | Las plantillas personalizadas usan el mismo `renderTemplate` / `parseStructuredText` / `changeOrderDocumentationProfile`. |
| V. Pruebas con aserciones en Node puro | ✅ Pasa | Cualquier test nuevo se añade como `tests/*.test.mjs` con `node:assert/strict` y bundle esbuild, sin framework. |

Las cinco puertas pasan sin necesidad de justificación de violación.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-custom-templates/
├── plan.md              # Este archivo (salida de /speckit.plan)
├── research.md          # Salida Fase 0 (/speckit.plan)
├── data-model.md        # Salida Fase 1 (/speckit.plan)
├── quickstart.md        # Salida Fase 1 (/speckit.plan)
├── contracts/           # Salida Fase 1 (/speckit.plan)
│   ├── custom-template-shape.md
│   └── combined-template-registry.md
└── tasks.md             # Salida Fase 2 (/speckit.tasks - NO creado aquí)
```

### Código fuente (cambios previstos)

```text
src/
├── background/index.ts                    # Resolver plantilla por ID (built-in o custom)
├── options/main.tsx                       # Nueva sección "Custom templates" en la página de opciones
├── popup/main.tsx                         # Listar plantillas built-in + custom
├── templateRegistry/index.ts              # Nuevo helper getAvailableEmailTemplates
├── utils/types.ts                         # EmailTemplateId = string; ExtensionConfig.customTemplates
├── utils/config.ts                        # defaultConfig.customTemplates = []; sin migración
├── utils/helpers/customTemplate.ts        # Nuevo: validación, ID generation, combine
└── ... (resto sin cambios)
```

**Decisión de estructura**: se conserva la disposición actual (un único
proyecto MV3 con `src/` y `tests/` en la raíz, builds diferenciados por
Vite/esbuild según destino). Los cambios son aditivos; no se
introducen subproyectos, monorepos ni alias de rutas.

## Componentes Involucrados (cambios previstos)

| Componente | Ruta | Cambio previsto |
|------------|------|-----------------|
| Types | `src/utils/types.ts` | `EmailTemplateId = string` (antes union de tres literales); `ExtensionConfig.customTemplates: EmailTemplate[]`. |
| Config Defaults | `src/utils/config.ts` | Añadir `customTemplates: []` a `defaultConfig`. Sin migración: si el campo falta, se rellena con `[]` (merge defensivo en `getConfig`). |
| Template Registry | `src/templateRegistry/index.ts` | Añadir `getAvailableEmailTemplates(config)` que concatena `emailTemplates` y `config.customTemplates`. |
| Custom Template Helpers | `src/utils/helpers/customTemplate.ts` (nuevo) | `createCustomTemplate()`, `validateCustomTemplate()`, `isValidCustomTemplate()`. |
| Background | `src/background/index.ts` | `getEmailTemplateForConfig` debe resolver tanto built-in como custom; pasar el helper combinado o la config al resolver. |
| Popup | `src/popup/main.tsx` | Cargar la config al abrir, listar plantillas combinadas, permitir seleccionar custom. |
| Options | `src/options/main.tsx` | Nueva sección "Custom templates" con lista, botón **Add custom template**, editor por plantilla, botón **Delete**, sin botón **Restore**. |
| Persistence | `src/utils/config.ts` | `saveConfig` ya persiste todo el objeto `ExtensionConfig`, así que `customTemplates` queda persistido automáticamente. |

## Servicios y Dependencias Existentes

### Servicios del navegador (chrome.*)

- **`chrome.runtime`**, **`chrome.tabs`**, **`chrome.scripting`**,
  **`chrome.storage.local`** — sin cambios respecto al plan del spec
  001.
- **`crypto.randomUUID()`** — API web estándar disponible en Chrome/Edge
  modernos; se usa para generar IDs únicos de plantillas
  personalizadas.

### Dependencias

- **Sin nuevas dependencias**: el cambio se implementa con el stack
  actual (TypeScript + React + Vite + esbuild).
- Las **mismas declaraciones de tipos** del proyecto (`@types/chrome`,
  `@types/node`, `@types/react`, `@types/react-dom`) siguen siendo
  suficientes; `crypto.randomUUID()` está tipado en las librerías
  estándar de DOM.

### Tipos del dominio previstos

- `EmailTemplateId = string` (antes union de literales).
- `CustomEmailTemplate` (alias de `EmailTemplate` para documentos; los
  IDs son UUIDs autogenerados).
- `ExtensionConfig.customTemplates: EmailTemplate[]` (nuevo).

## Flujo de Datos

```
[Usuario en página de opciones]
        │
        │ 1. abrir opciones
        ▼
[options/main.tsx]
   2. getConfig()  ──► chrome.storage.local[onenoteToMailDraftConfig]
   3. state.config.customTemplates  ──► lista actual
   4. render: <section "Custom templates">
        - si lista vacía: mensaje "No custom templates yet."
        - si lista no vacía: por cada plantilla, editor + botón Delete
        - botón "Add custom template" al final
        │
        ▼
   5. usuario pulsa "Add custom template"
        ► state.config.customTemplates.push({ id: crypto.randomUUID(), label: "", description: "", subjectTemplate: "", bodyTemplate: "", fieldMappings: [], documentationProfile: changeOrderDocumentationProfile })
        ► re-render con nueva entrada
        │
        ▼
   6. usuario rellena label, subject, body
        ► state local de la entrada (no se persiste aún)
        │
        ▼
   7. usuario pulsa "Save" (en la página de opciones)
        ► validateCustomTemplate(t)  ──► { ok, error? }
        ► si !ok: mostrar error, abortar
        ► si ok: saveConfig({ ...config, customTemplates: [...] })
            ──► chrome.storage.local.set
        ► mostrar estado "✅ Settings saved"
        │
        ▼
[Usuario en popup]
   8. popup se abre
        ► getConfig() (async en useEffect)
        ► setAvailableTemplates(getAvailableEmailTemplates(config))
        │
        ▼
   9. render: <section className="templateOptions">
        - map(availableTemplates) → <button> con label y description
        │
        ▼
   10. usuario selecciona plantilla custom + pulsa "Send email"
        ► chrome.runtime.sendMessage({ type: "GENERATE_GMAIL_DRAFT", templateId: customId })
        │
        ▼
[background/index.ts]
   11. resolveTemplate(templateId, config):
        a. getEmailTemplateForConfig(templateId, config.templateOverrides) → built-in o fallback
        b. si no, buscar en config.customTemplates
        c. si tampoco, error
   12. resto del pipeline igual que en plan 001
        │
        ▼
[Gmail content script] inserción del HTML como en plan 001
```

## Estructuras de Datos Principales

### Cambio en `EmailTemplateId` (`src/utils/types.ts`)

```ts
// Antes
export type EmailTemplateId = "estimation" | "scope" | "completedQa";

// Después
export type EmailTemplateId = string;
```

**Razón**: las plantillas personalizadas tienen IDs arbitrarios
(UUIDs); el union anterior limitaría el tipo a tres literales. La
constante `defaultTemplateId = "estimation"` (en
`src/templateRegistry/index.ts`) sigue siendo válida como string y la
migración heredada sigue funcionando porque `migrateLegacyTemplateOverride`
accede por clave sin chequear tipo.

### `CustomEmailTemplate`

`CustomEmailTemplate` es un alias documentado de `EmailTemplate` con
las siguientes características:

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `string` | UUID v4 generado por `crypto.randomUUID()`. |
| `label` | `string` | Obligatorio; validado en guardado. |
| `description` | `string` | Opcional; puede ser vacío. |
| `subjectTemplate` | `string` | Obligatorio; validado en guardado. |
| `bodyTemplate` | `string` | Opcional; puede ser vacío. |
| `fieldMappings` | `FieldMapping[]` | Opcional; default `[]`. |
| `documentationProfile` | `DocumentationProfile` | Reutiliza `changeOrderDocumentationProfile`. |

### `ExtensionConfig.customTemplates` (nuevo)

```ts
type ExtensionConfig = {
  // ... campos existentes sin cambios
  customTemplates: EmailTemplate[];  // default: []
};
```

El merge defensivo en `getConfig` debe tratar la ausencia del campo
como `[]` (cumpliendo FR-012: tolerar esquema inválido o faltante).

## Integraciones Externas

- **Sin nuevas integraciones externas**. No hay llamadas `fetch`,
  `XMLHttpRequest`, WebSocket, ni endpoints remotos.
- `crypto.randomUUID()` es una API local del navegador.
- `chrome.storage.local` es la persistencia local existente.

## Contratos Previstos

| Contrato | Ruta | Propósito |
|----------|------|-----------|
| Forma de plantilla personalizada | `contracts/custom-template-shape.md` | Define los campos de `EmailTemplate` cuando se usa como plantilla personalizada (validación, autogeneración de IDs). |
| Registro combinado de plantillas | `contracts/combined-template-registry.md` | Define el orden y la combinación de built-in + custom expuesta al popup y al background. |

## Riesgos y Consideraciones Técnicas

- **ID collision**: mitigado por el uso de `crypto.randomUUID()` (UUID
  v4 con entropía criptográfica). Como defensa adicional, el guardado
  debe rechazar IDs duplicados o vacíos.
- **Validación bypass**: la validación se aplica en el handler de
  **Save** de la página de opciones, no en el almacenamiento; el
  popup y el background deben tolerar plantillas con campos vacíos
  (rechazo suave o sustitución por string vacío).
- **Plantillas con esquema inválido**: el popup debe filtrar
  plantillas inválidas (FR-012) y seguir mostrando las válidas
  (incluidas las integradas).
- **Cambio de tipo `EmailTemplateId`**: pasar de union a `string`
  elimina una garantía de tipo. Se mitiga documentando los IDs
  built-in como literales en `defaultTemplateId` y en
  `sharedFieldMappings`.
- **Persistencia atómica**: el botón **Save** persiste toda la
  config (incluidas `customTemplates`) de una sola vez; si la
  operación falla, no se aplica ningún cambio parcial.
- **Rendimiento del popup con muchas plantillas**: NFR-004 no impone
  límite, pero el popup debe renderizar la lista combinada de forma
  eficiente (el array se itera una sola vez; no hay virtualización
  compleja por el tamaño esperado).
- **`crypto.randomUUID()` no disponible**: en navegadores muy
  antiguos podría no estar; la constitución ya asume `chrome114`, por
  lo que se considera disponible.
- **Migración de config existente**: el nuevo campo
  `customTemplates` debe ser aditivo; los usuarios con configs
  previas (sin el campo) deben ver `[]` por defecto. No se requiere
  migración porque el merge defensivo en `getConfig` lo cubre.
- **Plantillas personalizadas no se persisten con la sesión del
  navegador del usuario sino en `chrome.storage.local`**: si el
  usuario desinstala la extensión o revoca el permiso `storage`, las
  plantillas se pierden.

## Trazabilidad de Artefactos

| Artefacto | Ruta | Propósito |
|-----------|------|-----------|
| Especificación | [spec.md](spec.md) | Alcance, historias de usuario, requisitos, criterios. |
| Investigación | [research.md](research.md) | Decisiones técnicas tomadas (cambio de tipo, helper combinado, etc.). |
| Modelo de datos | [data-model.md](data-model.md) | Entidades, campos, relaciones, ciclo de vida, validaciones. |
| Contratos | [contracts/](contracts/) | Forma de plantilla personalizada, registro combinado. |
| Quickstart | [quickstart.md](quickstart.md) | Escenarios de validación manual del nuevo flujo. |

## Seguimiento de Complejidad

No hay violaciones de la constitución que requieran justificación. Esta
sección se deja intencionadamente vacía.

**Rama**: `002-custom-templates` | **Plan**: `specs/002-custom-templates/plan.md`