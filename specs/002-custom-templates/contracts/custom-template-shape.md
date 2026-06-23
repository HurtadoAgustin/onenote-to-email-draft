# Contrato: Forma de una Plantilla Personalizada

**Funcionalidad**: 002-custom-templates
**Fecha**: 2026-06-23

## Descripción

`CustomEmailTemplate` es un alias documentado de `EmailTemplate` (en
`src/utils/types.ts`). Se usa para representar las plantillas creadas
íntegramente por el usuario desde la página de opciones.

## Tipo

```ts
type CustomEmailTemplate = EmailTemplate;
// Equivalente a:
type CustomEmailTemplate = {
  id: EmailTemplateId;          // string (UUID generado por crypto.randomUUID())
  label: string;
  description: string;
  subjectTemplate: string;      // con placeholders {{key}}
  bodyTemplate: string;         // HTML con placeholders {{key}}
  fieldMappings: FieldMapping[];
  documentationProfile: DocumentationProfile;
};
```

## Campos

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `id` | `string` | sí | UUID v4 generado por `crypto.randomUUID()`. Único. No se reutiliza tras eliminación. |
| `label` | `string` | sí (al guardar) | Etiqueta visible en el popup y en la página de opciones. Validación: no vacío. |
| `description` | `string` | no | Subtítulo visible en el popup. Puede ser vacío. |
| `subjectTemplate` | `string` | sí (al guardar) | Plantilla de asunto con placeholders `{{key}}`. Validación: no vacío. |
| `bodyTemplate` | `string` | no | Plantilla de cuerpo HTML con placeholders `{{key}}`. Puede ser vacío. |
| `fieldMappings` | `FieldMapping[]` | no | Default `[]`. Cada mapeo es `{ key, labels, required? }`. |
| `documentationProfile` | `DocumentationProfile` | sí (asignado) | Siempre `changeOrderDocumentationProfile` (compartido con built-ins). |

## Generación de ID

```ts
function createCustomTemplate(): EmailTemplate {
  return {
    id: crypto.randomUUID(),
    label: "",
    description: "",
    subjectTemplate: "",
    bodyTemplate: "",
    fieldMappings: [],
    documentationProfile: changeOrderDocumentationProfile
  };
}
```

## Validación al Guardar

```ts
type ValidationResult = { ok: true } | { ok: false; error: string };

function validateCustomTemplate(
  template: EmailTemplate,
  existingIds: string[]
): ValidationResult {
  if (!template.id || template.id.trim() === "") {
    return { ok: false, error: "Template id is missing." };
  }
  if (template.id === "estimation" || template.id === "scope" || template.id === "completedQa") {
    return { ok: false, error: "Template id collides with a built-in template id." };
  }
  if (existingIds.includes(template.id)) {
    return { ok: false, error: "Template id already exists." };
  }
  if (!template.label || template.label.trim() === "") {
    return { ok: false, error: "Label is required." };
  }
  if (!template.subjectTemplate || template.subjectTemplate.trim() === "") {
    return { ok: false, error: "Subject template is required." };
  }
  return { ok: true };
}
```

## Placeholders en `subjectTemplate` y `bodyTemplate`

Misma sintaxis que las plantillas integradas
(`contracts/template-placeholders.md` del spec 001):

- `{{key}}` — se sustituye por `data[key]`.
- Caracteres permitidos en `key`: `\w`, `.`, `-`.
- Escape por defecto en el body; sin escape en `estimationBreakdownTable`
  (no aplica a custom).

## Reglas de Idempotencia

- **Generación de ID**: cada llamada a `createCustomTemplate()`
  produce un ID nuevo (no se reutiliza).
- **Validación**: pura, sin efectos secundarios.
- **Persistencia**: `saveConfig` sobrescribe el array completo; no
  hay fusión incremental.

## Reglas de Versionado

- Añadir un campo opcional a `EmailTemplate` es compatible hacia
  atrás; los consumidores deben ignorarlo si no lo entienden.
- Eliminar o renombrar un campo existente de `EmailTemplate` es
  incompatible hacia atrás y afecta tanto a built-ins como a
  custom.
- Cambiar la forma de `id` (p. ej. exigir otro formato) es un
  cambio incompatible.

## Compatibilidad con el Contrato Existente

`CustomEmailTemplate` cumple la misma forma que `EmailTemplate` y,
por tanto, puede usarse en cualquier consumidor que espere un
`EmailTemplate`:

- `getAvailableEmailTemplates(config)` la concatena con built-ins.
- `renderTemplate(subjectTemplate, data)` y `renderTemplate(bodyTemplate, data)`
  funcionan idénticamente.
- `parseStructuredText(text, fieldMappings, documentationProfile)`
  acepta los `fieldMappings` y `documentationProfile` de un
  `CustomEmailTemplate` sin cambios.