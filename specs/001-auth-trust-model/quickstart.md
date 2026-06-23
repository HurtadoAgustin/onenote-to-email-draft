# Quickstart: Validación del Modelo de Confianza

**Funcionalidad**: 001-auth-trust-model
**Fecha**: 2026-06-23
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Objetivo

Validar manualmente que el modelo de confianza de la extensión se
comporta como está documentado, sin introducir pruebas adicionales.

## Prerrequisitos

- Node 20+ con `npm` disponible.
- Una copia del repositorio en el directorio de trabajo.
- Chrome (MV3) o Edge (MV3) con la sesión iniciada en OneNote Web y
  Gmail en `https://mail.google.com`.

## Setup

```bash
# desde la raíz del repositorio
npm install
npm run typecheck
npm run build
```

El build produce `dist/` con:

- `dist/popup.html`, `dist/options.html`, assets JS/CSS con hash.
- `dist/manifest.json` (copia del manifiesto fuente).
- `dist/background/index.js` (service worker ESM).
- `dist/content/onenote.js`, `dist/content/gmail.js` (content scripts IIFE).

## Carga como Extensión Sin Empaquetar

1. Abrir `chrome://extensions` (Chrome) o `edge://extensions` (Edge).
2. Activar el **modo desarrollador**.
3. Hacer clic en **Cargar extensión sin empaquetar** y seleccionar la
   carpeta `dist/`.
4. Verificar que la extensión aparece con el nombre
   "OneNote to Mail Draft" y sin errores.

## Escenarios de Validación

### Escenario 1 — Pestaña de OneNote válida (HU1, P1)

1. Abrir `https://*.onenote.com/` con una página que contenga el
   bloque de ejemplo del README:

   ```txt
   Client: ACME
   Ticket: INC-2031
   Issue: Authentication error
   Resolution: Service restart
   ```

2. Asegurarse de que la pestaña OneNote es la activa.
3. Hacer clic en el icono de la extensión en la barra del navegador.
4. Hacer clic en **Send email**.
5. Seleccionar la plantilla **Estimación**.

**Resultado esperado**:

- Se abre una nueva pestaña de Gmail.
- El cuadro de composición tiene el asunto y el cuerpo HTML
  prellenados con los datos extraídos.
- El popup muestra mensajes `✅ OneNote page read`,
  `ℹ️ Selected template: Estimación` y
  `✅ Gmail draft created for manual review`.

### Escenario 2 — Pestaña no-OneNote (HU1, AC2)

1. Abrir una pestaña en `https://example.com` (o cualquier sitio no
   declarado en `manifest.json`).
2. Hacerla activa.
3. Abrir el popup, hacer clic en **Send email** y elegir una plantilla.

**Resultado esperado**:

- No se abre Gmail.
- El popup muestra logs con prefijo `❌` indicando que la pestaña no
  es OneNote Web.

### Escenario 3 — OneNote sin contenido extraíble (HU1, AC3)

1. Abrir una página de OneNote Web completamente en blanco.
2. Hacer clic en **Send email** y elegir una plantilla.

**Resultado esperado**:

- No se abre Gmail.
- El popup muestra
  `❌ Text could not be extracted from OneNote` o
  `❌ OneNote did not return visible text`.

### Escenario 4 — Composición de Gmail existente (HU2, AC2)

1. Tener abierta manualmente una pestaña de Gmail con un cuadro de
   composición en blanco.
2. Volver a una pestaña de OneNote válida.
3. Hacer clic en **Send email**.

**Resultado esperado**:

- Se abre una pestaña nueva de Gmail.
- El borrador se inserta en el cuadro de composición más reciente de
  la pestaña recién abierta (no en la pestaña manual existente).

### Escenario 5 — Firma de Gmail estándar (HU2, AC3)

1. Tener configurada una firma automática en Gmail (cuenta con
   `gmail_signature` o `data-smartmail='gmail_signature'`).
2. Generar un borrador desde OneNote.

**Resultado esperado**:

- El cuadro de composición NO contiene la firma estándar de Gmail
  duplicada.

### Escenario 6 — Firma de Gmail personalizada (edge case documentado)

1. Configurar una firma personalizada en Gmail que NO use los
   selectores estándar (p. ej. en texto plano).
2. Generar un borrador desde OneNote.

**Resultado esperado**:

- El borrador puede contener la firma duplicada o en orden
  incorrecto; el usuario debe borrarla manualmente antes de enviar.
- La consola del navegador muestra `console.log("Selected email
  template:", ...)` y demás trazas.

### Escenario 7 — Configuración en opciones (HU3, AC1-3)

1. Hacer clic derecho en el icono de la extensión → **Opciones**.
2. Cambiar `mailUrl` a `https://mail.google.com/mail/u/1/#inbox?compose=new`.
3. Hacer clic en **Save**.

**Resultado esperado**:

- La barra de estado muestra `✅ Settings saved`.
- Cerrar la pestaña de opciones y reabrirla: el cambio persiste.
- Hacer clic en **Restore defaults**: la `mailUrl` vuelve al valor por
  defecto y el almacenamiento local se vacía.

### Escenario 8 — Migración de configuración heredada (HU4)

1. Abrir la consola del service worker:
   `chrome://extensions` → "Service worker" en la tarjeta de la
   extensión.
2. Ejecutar:

   ```js
   chrome.storage.local.set({
     onenoteToMailDraftConfig: {
       mailUrl: "https://mail.google.com/mail/u/0/#inbox?compose=new",
       subjectTemplate: "[Legacy] {{ticketNumber}}",
       bodyTemplate: "<p>Legacy body {{ticketNumber}}</p>",
       fieldMappings: [{ key: "ticketNumber", labels: ["Ticket Number"] }]
     }
   });
   ```

3. Cerrar y reabrir el popup (o ejecutar un `GENERATE_GMAIL_DRAFT`).
4. Inspeccionar `chrome.storage.local[onenoteToMailDraftConfig]`:

**Resultado esperado**:

- Los campos `subjectTemplate`, `bodyTemplate`, `fieldMappings` han
  desaparecido del objeto raíz.
- Aparecen dentro de `templateOverrides.estimation` con la clave
  original.
- Una segunda lectura no produce más cambios (idempotente).

### Escenario 9 — Popup cerrado durante generación (edge case documentado)

1. Abrir una pestaña de OneNote válida.
2. Hacer clic en **Send email** y elegir una plantilla.
3. Inmediatamente cerrar el popup (clic fuera o `Esc`).
4. Esperar 20–30 segundos.

**Resultado esperado**:

- El borrador SÍ se inserta en Gmail.
- No se muestra ninguna notificación (los logs se pierden con el
  popup).

### Escenario 10 — Gmail ya abierto en otra pestaña (edge case documentado)

1. Tener una pestaña de Gmail abierta manualmente (p. ej. en el inbox).
2. Volver a una pestaña de OneNote válida.
3. Hacer clic en **Send email** y elegir una plantilla.

**Resultado esperado**:

- Se abre una pestaña nueva de Gmail (no se reutiliza la existente).
- Tras N usos consecutivos, hay N+1 pestañas de Gmail.

## Validación de Pruebas Existentes

```bash
node tests/onenote-ticket-metadata.test.mjs
node tests/onenote-level-hints.test.mjs
```

**Resultado esperado**:

- Cada test imprime `PASS: ...` y termina con código 0.
- Las aserciones verifican:
  - Parsing de metadatos del ticket (`choNumber`, `ticketNumber`,
    `clientAndModule`, `clientChoRequester`).
  - Render del subject y del HTML con `ticketUrl` codificado.
  - Aplicación de `applyEmptyFieldFallback` con `additionalContext`
    vacío.
  - Inferencia de niveles anidados vía `rectLeft` del DOM.

## Validación de Typecheck

```bash
npm run typecheck
```

**Resultado esperado**:

- Sin errores. El compilador `tsc --noEmit` valida `src/`, `scripts/`
  y `vite.config.ts`.

## Diagnóstico de Fallos

- **No se abre Gmail tras Send email**: comprobar que la pestaña
  activa es OneNote Web; revisar logs en la consola del service
  worker (`chrome://extensions` → "Service worker").
- **El cuadro de composición no recibe el HTML**: probablemente los
  selectores por defecto de Gmail han cambiado; abrir Opciones y
  actualizar `config.selectors`.
- **Los campos aparecen vacíos**: revisar `FieldMapping.labels` para
  la plantilla correspondiente; ajustar `config.templateOverrides` si
  es necesario.
- **La firma de Gmail queda duplicada**: comportamiento documentado;
  borrar manualmente antes de enviar.

## Próximos Pasos

Tras validar manualmente los escenarios, la especificación queda
lista para `/speckit.tasks` (derivación de tareas de implementación /
mantenimiento si fueran necesarias) o para servir como referencia de
comportamiento actual.