# Quickstart: Validación de Plantillas Personalizadas

**Funcionalidad**: 002-custom-templates
**Fecha**: 2026-06-23
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Objetivo

Validar manualmente que la funcionalidad de plantillas personalizadas
se comporta como está documentado, sin añadir pruebas automatizadas
nuevas (las existentes deben seguir pasando).

## Prerrequisitos

- Node 20+ con `npm` disponible.
- Una copia del repositorio con los cambios de la feature ya
  aplicados.
- Chrome (MV3) o Edge (MV3) con la sesión iniciada en OneNote Web y
  Gmail.

## Setup

```bash
# desde la raíz del repositorio
npm install
npm run typecheck
npm run build
```

Cargar `dist/` como extensión sin empaquetar desde
`chrome://extensions` (Chrome) o `edge://extensions` (Edge) con el
modo desarrollador activado.

## Escenarios de Validación

### Escenario 1 — Crear una plantilla personalizada (US1)

1. Abrir la página de opciones (clic derecho en el icono de la
   extensión → **Opciones**).
2. Localizar la nueva sección **Custom templates**.
3. Pulsar **Add custom template**.
4. Rellenar:
   - `label`: "Recordatorio interno"
   - `description`: "Correo corto de seguimiento"
   - `subjectTemplate`: `[{{clientAndModule}}] Recordatorio {{ticketNumber}}`
   - `bodyTemplate`: `<p>Hola {{clientChoRequester}},</p><p>Te recuerdo el ticket {{ticketNumber}}.</p>`
   - `fieldMappings`: `[]` (vacío; se usan los del perfil
     `changeOrder`).
5. Pulsar **Save**.

**Resultado esperado**:

- El estado muestra `✅ Settings saved`.
- El array `customTemplates` en `chrome.storage.local` contiene una
  entrada con un `id` UUID y los valores introducidos.

### Escenario 2 — Visibilidad en el popup (US1 AC3)

1. Abrir una pestaña de OneNote Web con el ejemplo de la
   documentación:

   ```txt
   Client: ACME
   Ticket: INC-2031
   Issue: Authentication error
   Resolution: Service restart
   ```

2. Hacerla activa y abrir el popup.

**Resultado esperado**:

- La lista de plantillas del popup muestra, en este orden:
  - Estimación, Alcance, Completado en QA (built-in)
  - "Recordatorio interno" (custom, recién creada)

### Escenario 3 — Validación de campos obligatorios (US1 AC4, FR-010)

1. En la página de opciones, pulsar **Add custom template**.
2. Dejar `label` vacío, rellenar `subjectTemplate`, pulsar **Save**.

**Resultado esperado**:

- El guardado se rechaza; se muestra un mensaje de error claro
  (p. ej. "Label is required").
- La plantilla NO queda persistida en `chrome.storage.local`.

Repetir con `label` válido pero `subjectTemplate` vacío: mismo
resultado con el mensaje "Subject template is required".

### Escenario 4 — Body vacío permitido (US1 AC4, FR-011)

1. Crear una plantilla con `label` y `subjectTemplate` válidos pero
   `bodyTemplate` vacío.
2. Pulsar **Save**.

**Resultado esperado**:

- El guardado se completa; el estado muestra `✅ Settings saved`.

### Escenario 5 — Editar una plantilla personalizada (US2)

1. En la página de opciones, seleccionar la plantilla
   personalizada creada en el Escenario 1.
2. Cambiar `description` a "Correo de seguimiento más descriptivo".
3. Pulsar **Save**.

**Resultado esperado**:

- El estado muestra `✅ Settings saved`.
- Al abrir el popup, la plantilla muestra la nueva descripción.

### Escenario 6 — Eliminar una plantilla personalizada (US3)

1. En la página de opciones, pulsar **Delete** junto a una plantilla
   personalizada.
2. Confirmar (si el flujo lo requiere) y pulsar **Save**.

**Resultado esperado**:

- La plantilla desaparece de la lista en la página de opciones.
- Al abrir el popup, la plantilla ya no aparece como opción
  seleccionable.

### Escenario 7 — Sin botón Restore para custom (US3, FR-005, SC-006)

1. En la página de opciones, seleccionar una plantilla personalizada.

**Resultado esperado**:

- NO se muestra ningún botón **Restore** para esa plantilla.
- Si hay una plantilla integrada seleccionada, el botón
  **Restore selected template** SÍ está disponible (comportamiento
  previo).

### Escenario 8 — Usar una plantilla personalizada (US4)

1. Abrir una pestaña de OneNote Web con un ticket que tenga los
   campos `{{ticketNumber}}` y `{{clientChoRequester}}`
   identificables (p. ej. el ejemplo del README).
2. Abrir el popup, seleccionar la plantilla personalizada
   "Recordatorio interno", pulsar **Send email**.

**Resultado esperado**:

- Se abre una nueva pestaña de Gmail.
- El asunto contiene `[ACME] Recordatorio T-12345`
  (o el valor real del ticket parseado).
- El cuerpo contiene el HTML personalizado con los placeholders
  sustituidos.

### Escenario 9 — Persistencia entre recargas y reinicios (US5)

1. Crear 2–3 plantillas personalizadas.
2. En `chrome://extensions`, recargar la extensión.
3. Cerrar y reabrir el navegador.

**Resultado esperado**:

- Las plantillas personalizadas siguen presentes en la página de
  opciones y en el popup.

### Escenario 10 — Tolerancia a esquema inválido (FR-012, SC-008)

1. Abrir la consola del service worker de la extensión.
2. Inyectar una plantilla con esquema inválido:

   ```js
   chrome.storage.local.set({
     onenoteToMailDraftConfig: {
       customTemplates: [
         { id: "valid-1", label: "OK", subjectTemplate: "Hi", bodyTemplate: "p", fieldMappings: [], documentationProfile: null },
         { id: "", label: "Bad", subjectTemplate: "x", bodyTemplate: "", fieldMappings: [], documentationProfile: null }
       ]
     }
   });
   ```

3. Recargar la extensión y abrir el popup.

**Resultado esperado**:

- El popup sigue siendo funcional.
- La plantilla inválida (sin `label`, `subjectTemplate` o con
  esquema roto) no se muestra, o se muestra con una indicación de
  inválida; las integradas siguen funcionando.

## Validación de Pruebas Existentes

```bash
node tests/onenote-ticket-metadata.test.mjs
node tests/onenote-level-hints.test.mjs
```

**Resultado esperado**:

- Ambos imprimen `PASS: ...` y terminan con código 0.
- Los tests existentes NO se modifican; verifican que las plantillas
  integradas siguen funcionando.

## Validación de Typecheck

```bash
npm run typecheck
```

**Resultado esperado**:

- Sin errores. El compilador valida que el cambio de tipo
  `EmailTemplateId = string` no rompe consumidores.

## Diagnóstico de Fallos

- **La plantilla personalizada no aparece en el popup**: comprobar
  que **Save** se pulsó y que la config quedó persistida en
  `chrome.storage.local`; recargar el popup.
- **El guardado se rechaza sin mensaje claro**: revisar la consola
  del service worker para ver el error de validación.
- **Los placeholders no se sustituyen**: verificar que el
  `bodyTemplate` y el `subjectTemplate` usan la sintaxis
  `{{key}}` correcta; los placeholders no se resuelven si el
  `TemplateData` no contiene esa clave (queda string vacío).
- **El popup muestra plantilla inválida**: revisar el merge
  defensivo en `getConfig` y el filtro del popup; las plantillas
  inválidas deben omitirse.

## Próximos Pasos

Tras validar manualmente los escenarios, la feature queda lista para
`/speckit.tasks` (derivación de tareas de implementación) o para
servir como guía durante la fase de implementación.