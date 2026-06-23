# Contrato: Registro Combinado de Plantillas

**Funcionalidad**: 002-custom-templates
**Fecha**: 2026-06-23

## Descripción

El popup y el background necesitan una vista unificada de las
plantillas disponibles (built-in + personalizadas). Este contrato
define cómo se combinan y cómo se resuelven por ID.

## Helper: `getAvailableEmailTemplates`

```ts
// En src/templateRegistry/index.ts
export const getAvailableEmailTemplates = (
  config: ExtensionConfig
): EmailTemplate[] => [
  ...emailTemplates,
  ...config.customTemplates
];
```

## Orden de la Lista Combinada

1. **Built-in primero**: `estimation`, `scope`, `completedQa` (en el
   orden declarado en `emailTemplates`).
2. **Custom después**: en el orden en que aparecen en
   `config.customTemplates` (orden de creación o de edición según
   como el usuario las haya añadido en la página de opciones).

## Resolución por ID

```ts
// En src/background/index.ts (lógica propuesta)
function resolveTemplate(templateId: string, config: ExtensionConfig): EmailTemplate {
  // 1. Buscar en built-in (con overrides aplicados)
  const builtIn = getEmailTemplateForConfig(
    templateId as EmailTemplateId,
    config.templateOverrides
  );
  if (builtIn.id === templateId) {
    return builtIn;
  }
  // 2. Buscar en custom
  const custom = config.customTemplates.find(t => t.id === templateId);
  if (custom) {
    return custom;
  }
  // 3. Fallback: estimación (built-in por defecto)
  return getEmailTemplateForConfig("estimation", config.templateOverrides);
}
```

**Nota**: la firma exacta puede variar (p. ej. lanzar un error si
el ID no existe en ninguna fuente), pero el orden de búsqueda
built-in → custom → fallback debe respetarse.

## Garantías

- **El array retornado es de solo lectura lógica**: el popup y el
  background no deben mutarlo. La mutación ocurre solo en
  `customTemplates` (estado persistido).
- **El array es estable durante una sesión**: las adiciones o
  eliminaciones de custom solo se reflejan tras recargar la
  config desde `chrome.storage.local`.
- **El orden es determinista**: el popup muestra siempre el mismo
  orden tras la misma carga de config.

## Versionado

- Añadir una nueva plantilla integrada a `emailTemplates` la coloca
  automáticamente al inicio de la lista combinada.
- Renombrar una plantilla integrada cambia su `label` y
  `description` pero conserva su `id`; las selecciones previas siguen
  funcionando.
- Eliminar una plantilla integrada requiere migración: las configs
  existentes con `templateOverrides[removedId]` deben limpiarse.