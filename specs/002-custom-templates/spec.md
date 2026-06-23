# Especificación de Funcionalidad: Plantillas Personalizadas de Correo

**Rama de la Funcionalidad**: `[002-custom-templates]`

**Creada**: 2026-06-23

**Estado**: Borrador

**Entrada**: Descripción del usuario: "quisiera que los usuarios puedan crear su propios templates personalizados. Esto debe estar en la sección de las configuraciones. Esto debe estar guardado en el localStorage también, y no debe existir la opción de 'restore' ya que es uno nuevo completamente."

## Resumen Ejecutivo

La extensión ofrece actualmente tres plantillas integradas (`estimation`,
`scope`, `completedQa`) que el usuario puede sobrescribir mediante
`templateOverrides`, pero no puede crear plantillas nuevas. Esta
funcionalidad añade la posibilidad de que el usuario defina **plantillas
personalizadas** completamente nuevas, las persista en el almacenamiento
local del navegador, y las use en el popup exactamente igual que las
plantillas integradas.

Las plantillas personalizadas se gestionan desde la **página de
opciones** (no desde el popup). No existe opción de "restaurar" para
ellas porque son creadas íntegramente por el usuario y no tienen un
original desde el que restaurar.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 — Crear una plantilla personalizada (Prioridad: P1)

Como usuario, abro la página de opciones, creo una nueva plantilla
personalizada con mi propio asunto, cuerpo y mapeos de campos, y la
guardo. A partir de ese momento, la plantilla aparece en el popup y
puedo usarla para generar borradores.

**Por qué esta prioridad**: es la entrada del flujo; sin la capacidad
de crear plantillas personalizadas, el resto de las historias no
existen.

**Prueba independiente**: el usuario debe poder crear una plantilla
personalizada desde la página de opciones, guardarla, y verla
disponible en el popup sin reinstalar la extensión.

**Escenarios de aceptación**:

1. **Dado** que el usuario está en la página de opciones, **cuando**
   pulsa **Add custom template**, **entonces** aparece un nuevo editor
   de plantilla en blanco con campos para `label`, `description`,
   `subjectTemplate`, `bodyTemplate` y `fieldMappings`, listo para ser
   rellenado.
2. **Dado** que el usuario rellena los campos obligatorios (label,
   subject, body) y pulsa **Save**, **cuando** la operación termina,
   **entonces** la plantilla queda persistida en el almacenamiento
   local del navegador y el editor muestra un estado `✅ Settings saved`.
3. **Dado** que la plantilla está guardada, **cuando** el usuario abre
   el popup, **entonces** la plantilla personalizada aparece en la lista
   de plantillas junto a las integradas (`estimation`, `scope`,
   `completedQa`).
4. **Dado** que el usuario rellena label o subject vacíos y pulsa
   **Save**, **cuando** la operación termina, **entonces** la
   extensión rechaza el guardado, muestra un mensaje de error claro y
   no persiste la plantilla.

---

### Historia de Usuario 2 — Editar una plantilla personalizada existente (Prioridad: P1)

Como usuario, abro la página de opciones, selecciono una plantilla
personalizada existente, modifico sus campos y guardo los cambios. La
versión actualizada queda disponible en el popup.

**Por qué esta prioridad**: editar es tan importante como crear; sin
edición, los errores de tecleo requerirían borrar y recrear.

**Prueba independiente**: tras editar y guardar, la nueva versión debe
ser visible en el popup y debe usarse en la siguiente generación de
borrador.

**Escenarios de aceptación**:

1. **Dado** que el usuario tiene al menos una plantilla personalizada
   guardada, **cuando** selecciona esa plantilla en la página de
   opciones, **entonces** el editor muestra sus campos actuales.
2. **Dado** que el usuario modifica uno o varios campos y pulsa
   **Save**, **cuando** la operación termina, **entonces** los
   cambios quedan persistidos y el estado `✅ Settings saved` se
   muestra.
3. **Dado** que el usuario ha editado y guardado, **cuando** abre el
   popup, **entonces** la plantilla personalizada muestra los nuevos
   valores en su etiqueta/descripción.

---

### Historia de Usuario 3 — Eliminar una plantilla personalizada (Prioridad: P2)

Como usuario, decido que una plantilla personalizada ya no me es útil.
La elimino desde la página de opciones y desaparece del popup.

**Por qué esta prioridad**: completar el ciclo de vida de la
funcionalidad; sin borrado, las plantillas obsoletas se acumulan.

**Prueba independiente**: tras eliminar, la plantilla no debe aparecer
ni en la página de opciones ni en el popup, y los borradores
generados a partir de ella dejan de ser seleccionables.

**Escenarios de aceptación**:

1. **Dado** que el usuario tiene al menos una plantilla personalizada
   guardada, **cuando** pulsa el botón **Delete** asociado a esa
   plantilla, **entonces** la plantilla se elimina del almacenamiento
   local y desaparece de la lista de la página de opciones.
2. **Dado** que la plantilla ha sido eliminada, **cuando** el usuario
   abre el popup, **entonces** esa plantilla ya no aparece en la
   lista de plantillas seleccionables.
3. **Dado** que el usuario intenta eliminar la última plantilla
   personalizada, **cuando** confirma la acción, **entonces** la
   operación se completa y la lista de plantillas personalizadas
   queda vacía sin error.

---

### Historia de Usuario 4 — Usar una plantilla personalizada para generar un borrador (Prioridad: P1)

Como usuario, selecciono una plantilla personalizada en el popup y
pulso **Send email**. La extensión genera el borrador de Gmail
usando esa plantilla y lo deja listo para revisión manual.

**Por qué esta prioridad**: sin uso real, la funcionalidad no aporta
valor; este flujo demuestra el encaje con el pipeline existente.

**Prueba independiente**: el borrador generado en Gmail debe usar
exclusivamente el `subjectTemplate`, `bodyTemplate` y `fieldMappings`
de la plantilla personalizada seleccionada.

**Escenarios de aceptación**:

1. **Dado** que el usuario tiene una plantilla personalizada guardada y
   está en una pestaña de OneNote Web válida, **cuando** abre el
   popup, selecciona la plantilla personalizada y pulsa **Send email**,
   **entonces** el borrador en Gmail usa el asunto y cuerpo definidos
   en esa plantilla personalizada.
2. **Dado** que el `bodyTemplate` de la plantilla personalizada
   referencia placeholders (`{{key}}`) que el parser no produce
   (p. ej. una clave inexistente), **cuando** se genera el borrador,
   **entonces** los placeholders faltantes se sustituyen por string
   vacío y el borrador sigue siendo válido.
3. **Dado** que la plantilla personalizada está guardada y luego se
   elimina, **cuando** el usuario abre el popup, **entonces** la
   plantilla eliminada ya no es seleccionable.

---

### Historia de Usuario 5 — Las plantillas personalizadas sobreviven a recargas y reinicios (Prioridad: P2)

Como usuario, mis plantillas personalizadas persisten entre recargas de
la extensión y entre sesiones del navegador.

**Por qué esta prioridad**: requisito de persistencia ya garantizado
por el uso de `chrome.storage.local`; debe verificarse explícitamente.

**Prueba independiente**: tras crear, recargar la extensión y
reiniciar el navegador, las plantillas personalizadas siguen
disponibles.

**Escenarios de aceptación**:

1. **Dado** que el usuario tiene plantillas personalizadas guardadas,
   **cuando** recarga la extensión desde `chrome://extensions`,
   **entonces** las plantillas siguen listadas en la página de
   opciones y en el popup.
2. **Dado** que el usuario tiene plantillas personalizadas guardadas,
   **cuando** cierra y reabre el navegador, **entonces** las
   plantillas siguen listadas y operativas.

---

### Casos Límite

- ¿Qué ocurre si el usuario intenta guardar una plantilla
  personalizada con `label` vacío? La extensión rechaza el guardado y
  muestra un mensaje claro; no se persiste.
- ¿Qué ocurre si el usuario intenta guardar una plantilla
  personalizada con `subjectTemplate` vacío? La extensión rechaza el
  guardado; no se persiste.
- ¿Qué ocurre si el `bodyTemplate` está vacío? La extensión permite
  guardarlo (el usuario puede querer un borrador solo con el asunto).
- ¿Qué ocurre si el usuario crea una plantilla personalizada con un
  `label` igual al de una integrada? Se permite (el identificador
  interno es independiente del label visible).
- ¿Qué ocurre si el usuario edita una plantilla personalizada y
  mientras edita se cierra la página de opciones? Se pierden los
  cambios no guardados; los valores persistidos no se modifican.
- ¿Qué ocurre si el almacenamiento local del navegador está lleno o
  inaccesible? La extensión muestra un mensaje de error de
  persistencia; las plantillas integradas siguen funcionando.
- ¿Qué ocurre si el usuario intenta eliminar una plantilla
  personalizada mientras otra pestaña la está usando para generar un
  borrador? La generación en curso se completa con los datos
  previamente leídos; la siguiente generación usa la lista actualizada.
- ¿Qué ocurre si una plantilla personalizada se corrompe o tiene un
  esquema inesperado? La extensión la ignora al listar plantillas
  válidas y no interrumpe el popup; las plantillas integradas siguen
  funcionando.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El usuario DEBE poder crear plantillas personalizadas
  desde la página de opciones, rellenando `label`, `description`
  (opcional), `subjectTemplate`, `bodyTemplate` y `fieldMappings`
  (opcional).
- **FR-002**: La página de opciones DEBE persistir las plantillas
  personalizadas en el almacenamiento local del navegador, bajo la
  misma clave dedicada al resto de la configuración.
- **FR-003**: La página de opciones DEBE permitir editar cualquier
  plantilla personalizada existente y guardar los cambios.
- **FR-004**: La página de opciones DEBE permitir eliminar cualquier
  plantilla personalizada existente; la eliminación se aplica al
  guardar.
- **FR-005**: La página de opciones NO DEBE ofrecer ninguna opción de
  "restaurar" para plantillas personalizadas, ya que son
  íntegramente creadas por el usuario y no tienen un original desde
  el que restaurar.
- **FR-006**: El popup DEBE mostrar las plantillas personalizadas en
  la misma lista que las plantillas integradas, sin distinción visual
  obligatoria más allá del orden o agrupación lógica.
- **FR-007**: El popup DEBE permitir seleccionar cualquier plantilla
  personalizada para iniciar la generación de un borrador, del mismo
  modo que con las plantillas integradas.
- **FR-008**: La generación de un borrador a partir de una plantilla
  personalizada DEBE usar exclusivamente el `subjectTemplate`,
  `bodyTemplate` y `fieldMappings` de esa plantilla, sin mezclarse
  con los de las integradas.
- **FR-009**: El identificador interno de una plantilla personalizada
  DEBE ser único y distinto de los identificadores de las plantillas
  integradas (`estimation`, `scope`, `completedQa`).
- **FR-010**: La extensión DEBE rechazar el guardado de una plantilla
  personalizada con `label` o `subjectTemplate` vacíos, mostrando un
  mensaje claro al usuario.
- **FR-011**: La extensión DEBE permitir guardar una plantilla
  personalizada con `bodyTemplate` vacío (es decisión del usuario).
- **FR-012**: La extensión DEBE tolerar plantillas personalizadas con
  esquema inválido o corrupto: las ignora al listar plantillas
  válidas y no interrumpe el popup ni las integradas.

### Requisitos No Funcionales

- **NFR-001 (Persistencia)**: Las plantillas personalizadas DEBEN
  persistir entre recargas de la extensión y entre sesiones del
  navegador, usando el mismo mecanismo de almacenamiento local que el
  resto de la configuración.
- **NFR-002 (Privacidad)**: Las plantillas personalizadas NO DEBEN
  transmitirse a ningún endpoint remoto; permanecen en el equipo del
  usuario.
- **NFR-003 (Aislamiento)**: Las plantillas personalizadas DEBEN
  respetar la constitución del proyecto: TypeScript estricto, ESM, sin
  credenciales en el almacenamiento, sin IA, sin red.
- **NFR-004 (Capacidad)**: La extensión NO DEBE imponer un límite
  arbitrario al número de plantillas personalizadas que un usuario
  puede crear; el único límite es la cuota del almacenamiento local
  del navegador.
- **NFR-005 (UX)**: La gestión de plantillas personalizadas (crear,
  editar, eliminar) DEBE ocurrir exclusivamente desde la página de
  opciones, no desde el popup.
- **NFR-006 (Consistencia visual)**: El botón **Save** de la página
  de opciones DEBE persistir tanto la configuración general como las
  plantillas personalizadas en una sola acción coherente.

### Entidades Clave *(incluir si la funcionalidad involucra datos)*

- **Plantilla personalizada (CustomEmailTemplate)**: combinación
  definida por el usuario de `label`, `description`, `subjectTemplate`,
  `bodyTemplate`, `fieldMappings` y `documentationProfile`. Tiene un
  `id` interno autogenerado y único. Se almacena en el almacenamiento
  local del navegador junto al resto de la configuración.
- **Lista de plantillas personalizadas (`customTemplates`)**: array de
  `CustomEmailTemplate` que forma parte de la configuración persistida.
  Vacío por defecto.
- **Lista combinada de plantillas (built-in + custom)**: unión lógica
  de las plantillas integradas (`estimation`, `scope`, `completedQa`)
  y las personalizadas del usuario. El popup itera sobre esta lista
  combinada para mostrar las opciones.
- **Configuración de la extensión (`ExtensionConfig`)**: estado local
  persistido por el usuario. La introducción de `customTemplates` es
  aditiva: los campos existentes se conservan sin cambios.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: El usuario puede crear una plantilla personalizada,
  guardarla y verla en el popup en menos de 60 segundos, sin
  reinstalar la extensión.
- **SC-002**: El 100% de las plantillas personalizadas creadas
  aparecen en el popup junto a las integradas tras guardar.
- **SC-003**: El 100% de las plantillas personalizadas eliminadas
  dejan de aparecer tanto en la página de opciones como en el popup
  tras guardar.
- **SC-004**: El 100% de los borradores generados desde una plantilla
  personalizada usan el `subjectTemplate` y `bodyTemplate` definidos
  en esa plantilla, sin mezcla con las integradas.
- **SC-005**: Las plantillas personalizadas persisten tras cerrar y
  reabrir el navegador en el 100% de los casos.
- **SC-006**: La página de opciones NO muestra ninguna opción de
  "restaurar" asociada a plantillas personalizadas.
- **SC-007**: El guardado de una plantilla con `label` o
  `subjectTemplate` vacíos es rechazado en el 100% de los casos, sin
  persistir datos incompletos.
- **SC-008**: El popup sigue siendo funcional aunque existan
  plantillas personalizadas con esquema inválido en el almacenamiento
  local.

## Suposiciones

- El usuario asume la responsabilidad de definir plantillas
  personalizadas que produzcan borradores útiles; la extensión no
  valida la corrección semántica del contenido (solo la integridad
  de campos obligatorios).
- Las plantillas personalizadas usan el mismo perfil de documentación
  (`changeOrder`) que las integradas; la extensión no expone un editor
  de perfil.
- El identificador interno de cada plantilla personalizada es
  autogenerado (no lo introduce el usuario); el label visible puede
  repetirse entre plantillas o coincidir con el de una integrada.
- El almacenamiento local del navegador tiene una cuota suficiente
  para guardar un número razonable de plantillas personalizadas (cada
  plantilla ocupa pocos kilobytes de texto).
- El usuario es el único responsable de las plantillas personalizadas
  que crea; la extensión no las audita, modera ni revisa.
- El botón **Save** de la página de opciones persiste la
  configuración completa (incluyendo `customTemplates`) de forma
  atómica, no incremental.