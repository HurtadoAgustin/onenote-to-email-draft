# Modelo de Datos: Plantillas Personalizadas de Correo

**Funcionalidad**: 002-custom-templates
**Fecha**: 2026-06-23
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Entidades

### 1. `CustomEmailTemplate` (alias documentado de `EmailTemplate`)

Plantilla definida íntegramente por el usuario.

| Campo | Tipo | Default | Validación |
|-------|------|---------|------------|
| `id` | `string` | `crypto.randomUUID()` autogenerado | Único; no vacío; no colisiona con built-ins. |
| `label` | `string` | `""` | Obligatorio al guardar; rechazo si vacío. |
| `description` | `string` | `""` | Opcional. |
| `subjectTemplate` | `string` | `""` | Obligatorio al guardar; rechazo si vacío. |
| `bodyTemplate` | `string` | `""` | Opcional. |
| `fieldMappings` | `FieldMapping[]` | `[]` | Opcional; default `[]`. |
| `documentationProfile` | `DocumentationProfile` | `changeOrderDocumentationProfile` | Compartido con built-ins. |

> Nota: `CustomEmailTemplate` es un alias de `EmailTemplate`; la
> distinción es documental. El campo `id` (UUID) lo distingue
> internamente de los IDs built-in.

### 2. `ExtensionConfig.customTemplates` (nuevo campo)

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `customTemplates` | `EmailTemplate[]` | `[]` | Añadido a `defaultConfig` y mergeado en `getConfig` (fallback a `[]` si ausente). |

### 3. Cambio en `EmailTemplateId`

```ts
// Antes
export type EmailTemplateId = "estimation" | "scope" | "completedQa";

// Después
export type EmailTemplateId = string;
```

**Impacto**: los IDs built-in siguen siendo strings válidos
(`"estimation"`, `"scope"`, `"completedQa"`); el literal
`defaultTemplateId = "estimation"` y `migrateLegacyTemplateOverride`
siguen funcionando.

### 4. `getAvailableEmailTemplates(config)` (nuevo helper)

```ts
function getAvailableEmailTemplates(config: ExtensionConfig): EmailTemplate[] {
  return [...emailTemplates, ...config.customTemplates];
}
```

## Relaciones

```
ExtensionConfig
├── ... (campos existentes)
└── customTemplates: EmailTemplate[]
        │
        └──► CustomEmailTemplate (con id UUID)
                ├── label
                ├── description
                ├── subjectTemplate
                ├── bodyTemplate
                ├── fieldMappings ──► FieldMapping[]
                └── documentationProfile ──► changeOrderDocumentationProfile (compartido)

getAvailableEmailTemplates(config)
        │
        ├── emailTemplates  ──► EmailTemplate[] (built-in: estimation, scope, completedQa)
        └── config.customTemplates  ──► EmailTemplate[] (custom)

Popup (src/popup/main.tsx)
        │  lee config, llama getAvailableEmailTemplates
        ▼
   availableTemplates  ──► user selecciona → templateId  ──► chrome.runtime.sendMessage

Background (src/background/index.ts)
        │  recibe templateId + config
        ▼
   resolveTemplate(templateId, config)
        ├── getEmailTemplateForConfig(templateId, overrides)  ──► built-in o fallback
        └── buscar en config.customTemplates por id
```

## Ciclo de Vida

### Creación

1. Usuario pulsa **Add custom template** en opciones.
2. Helper `createCustomTemplate()` (en
   `src/utils/helpers/customTemplate.ts`) genera una nueva entrada:
   - `id = crypto.randomUUID()`
   - `label = ""`, `description = ""`, `subjectTemplate = ""`,
     `bodyTemplate = ""`, `fieldMappings = []`
   - `documentationProfile = changeOrderDocumentationProfile`
3. La entrada se añade al estado local de la página de opciones.

### Edición

1. Usuario modifica los campos en la página de opciones (estado local).
2. Sin persistencia automática; los cambios se mantienen en memoria.
3. Al pulsar **Save**, se valida y se persiste.

### Validación al guardar

1. `validateCustomTemplate(template)` comprueba:
   - `id` no vacío y único en `customTemplates`.
   - `label !== ""` y `label.trim() !== ""`.
   - `subjectTemplate !== ""` y `subjectTemplate.trim() !== ""`.
2. Si falla, devuelve `{ ok: false, error: "..." }` y se muestra en la UI.
3. Si pasa, devuelve `{ ok: true }` y se persiste con `saveConfig`.

### Eliminación

1. Usuario pulsa **Delete** en una entrada.
2. La entrada se elimina del array `customTemplates` en el estado local.
3. Al pulsar **Save**, se persiste la lista actualizada.
4. El popup deja de mostrarla tras la próxima apertura.

### Persistencia

- `saveConfig({ ...config, customTemplates: [...] })` escribe todo el
  objeto `ExtensionConfig` en `chrome.storage.local` bajo la clave
  `onenoteToMailDraftConfig`.
- `getConfig()` lee la clave, hace merge defensivo (fallback a `[]`
  si el campo falta), aplica la migración heredada (que solo afecta
  a built-ins) y devuelve la config completa.

### Tolerancia a esquema inválido

- Si una entrada en `customTemplates` no cumple el tipo
  `EmailTemplate` (campos faltantes, tipos incorrectos), el popup la
  filtra y no la muestra.
- Si la lista completa es `null` o no es un array, el merge la
  trata como `[]`.
- El popup y el background siguen funcionando con las plantillas
  integradas y las personalizadas válidas.

## Reglas de Validación

| Regla | Origen | Acción |
|-------|--------|--------|
| `id` único | FR-009 | Rechazar si choca con built-ins o con otro custom. |
| `label` no vacío al guardar | FR-010 | Rechazar y mostrar error. |
| `subjectTemplate` no vacío al guardar | FR-010 | Rechazar y mostrar error. |
| `bodyTemplate` puede ser vacío | FR-011 | Permitir. |
| `fieldMappings` opcional | NFR-005 | Default `[]`. |
| `documentationProfile` siempre `changeOrder` | D8 | Asignar al crear. |
| `customTemplates` puede faltar en config | FR-012 | Merge defensivo a `[]`. |

## Reglas de Negocio Implícitas

1. **Etiquetas visibles repetibles**: el `label` no es identificador
   único; el `id` (UUID) sí. El usuario puede crear dos plantillas
   con el mismo `label`; el popup las distingue por `id` internamente
   y por orden en la lista.
2. **Sin migración de plantillas existentes**: las plantillas
   integradas no se convierten a personalizadas; coexisten.
3. **Sin clonar desde built-in**: el flujo actual no incluye un
   botón "Duplicate from built-in"; el usuario empieza desde blanco.
4. **Eliminación inmediata**: al pulsar **Delete** se elimina del
   estado local; la persistencia ocurre en el próximo **Save**. El
   usuario puede deshacer localmente antes de guardar (re-render
   con la lista previa).
5. **Sin versionado interno**: las plantillas personalizadas no
   llevan un campo `version`; cualquier cambio en la forma de
   `EmailTemplate` se gestiona a nivel de tipos TypeScript.
6. **Sin limpieza automática**: si una plantilla personalizada
   queda en el almacenamiento pero su `id` ya no se usa, permanece
   hasta que el usuario la elimine explícitamente.