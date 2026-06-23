# Contrato: Sintaxis de Placeholders en Plantillas

**Funcionalidad**: 001-auth-trust-model
**Fecha**: 2026-06-23

## Descripción

Las plantillas de asunto y cuerpo (`subjectTemplate`, `bodyTemplate`)
soportan placeholders de la forma `{{key}}` que se sustituyen por
valores del `TemplateData` mediante `renderTemplate` (en
`src/utils/template.ts`).

## Sintaxis

```
{{key}}
```

- Llaves de apertura/cierre: `{{` y `}}` (dos caracteres cada una).
- La clave se busca con la regex `{{\s*([\w.-]+)\s*}}`; se permiten
  caracteres alfanuméricos, guion bajo, punto y guion medio.
- Los espacios en blanco alrededor de la clave son opcionales:
  `{{ key }}` y `{{key}}` son equivalentes.

## Claves Reconocidas

Las claves disponibles dependen del `TemplateData` calculado para cada
flujo. Las claves producidas por el parser incluyen:

| Clave | Tipo | Origen |
|-------|------|--------|
| `choNumber` | `string` | Regex `CHO-NNN` |
| `ticketNumber` | `string` | Regex `T-N+` (normalizado a mayúsculas, sin espacios) |
| `clientChoRequester` | `string` | Sección "Original Request" → "Full name" |
| `clientAndModule` | `string` | Sección "Original Request" → "Client & module" |
| `templateType`, `TemplateType` | `string` | `EmailTemplate.label` |
| `titulo` | `string` | Sección "Title" |
| `descripcion` | `string` | Sección "Description" |
| `motivo` | `string` | Sección "Change Order Reason" |
| `cambios` | `ParsedListItem[]` | Sección "Behavior changes" |
| `integracion` | `ParsedListItem[]` | Sección "ERP Integration Conditions" |
| `updateConsiderations` | `ParsedListItem[]` | Sección "Update Considerations" |
| `technicalConditions` | `ParsedListItem[]` | Sección "Technical Conditions" |
| `additionalContext` | `ParsedListItem[]` | Sección "Additional context" |

Claves adicionales añadidas por el pipeline:

| Clave | Tipo | Origen |
|-------|------|--------|
| `ticketUrl` | `string` | Render de `ticketUrlTemplate` con `encodeURIComponent`. |
| `estimationBreakdownTable` | `string` (HTML) | Solo para plantilla `estimation`; vacío para otras. |
| `technicalArchitect` | `string` | `" John Doe"` (con espacio inicial) o `""` si vacío. |

Claves definidas por `FieldMapping` (override del usuario) se añaden
dinámicamente.

## Reglas de Sustitución

### Modo por defecto (`escapeValues: true`)

- `string` → se aplica `escapeHtml` y se reemplazan saltos de línea
  por `<br />`.
- `ParsedListItem[]` → se renderiza como `<ul>` anidado por nivel
  (`<ul><li>texto<ul>...</ul></li></ul>`).
- Claves en `htmlKeys` (`estimationBreakdownTable`) → se insertan
  crudas sin escape.
- Clave `updateConsiderations` → render especial con título en
  `<strong>` y detalles en `<li><em>...</em></li>`.
- Clave inexistente o vacía → se sustituye por string vacío.

### Modo `escapeValues: false`

- Todo se convierte a string (`Array.isArray ? join(" ") : String(value)`)
  y se inserta sin escape. **No recomendado** para contenido de
  usuario.

## `escapeHtml`

Aplica las sustituciones estándar:

| Entrada | Salida |
|---------|--------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#039;` |

## Ejemplos

```html
<!-- Plantilla de asunto típica -->
[Esker-{{clientAndModule}}][{{templateType}}] {{ticketNumber}} - {{titulo}}
```

```html
<!-- Plantilla de cuerpo típica -->
<p>Buenos días{{technicalArchitect}},</p>
<p>Te envío la estimación correspondiente al ticket
   <a href="{{ticketUrl}}" target="_blank">{{ticketNumber}}</a>.</p>
```

## Garantías

- **Escape por defecto**: las sustituciones escapan HTML salvo para las
  claves listadas en `htmlKeys` o cuando `escapeValues: false`.
- **Inmutabilidad de claves**: el conjunto de claves producidas por el
  parser es estable mientras no cambien
  `changeOrderDocumentationProfile.sectionHeadings` ni
  `sharedFieldMappings`.
- **Caracteres permitidos en claves**: solo `\w`, `.` y `-`.

## Versionado

- Añadir una clave nueva al `TemplateData` es compatible hacia atrás.
- Renombrar una clave existente es un cambio incompatible: los
  usuarios con overrides de plantilla que usen la clave antigua
  quedarán con campos vacíos.
- Cambiar la sintaxis de los placeholders (p. ej. de `{{key}}` a
  `${key}`) es un cambio incompatible.