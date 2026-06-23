# Especificación de Funcionalidad: Modelo de Confianza de Autenticación

**Rama de la Funcionalidad**: `[001-auth-trust-model]`

**Creada**: 2026-06-23

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Documenta el sistema de autenticación tal como funciona actualmente. Analiza el código existente y realiza ingeniería inversa del comportamiento actual sin modificarlo. Describe: Objetivo de la funcionalidad, Historias de usuario principales, Requisitos funcionales, Requisitos no funcionales, Casos límite, Criterios de aceptación. La especificación debe reflejar exactamente el comportamiento actual del sistema, no una versión idealizada."

## Resumen Ejecutivo

La extensión no implementa un sistema de autenticación propio. Su "modelo
de confianza" se apoya en tres pilares ya presentes en el navegador y en
el manifiesto de la extensión:

1. La sesión del navegador con OneNote Web (familia `*.onenote.com`,
   `*.office.com`, `*.officeapps.live.com`, `*.sharepoint.com`,
   `onedrive.live.com`).
2. La sesión del navegador con Gmail (`https://mail.google.com/*`).
3. La lista de hosts declarados en el manifiesto de la extensión, que
   actúa como frontera de seguridad y limita sobre qué pestañas la
   extensión puede actuar.

La extensión no solicita credenciales, no almacena tokens, no implementa
flujos OAuth ni inicio de sesión, y no expone ninguna pantalla de login.
Toda configuración del usuario se guarda en el almacenamiento local del
navegador, sin protección adicional contra acceso local por otras
extensiones o usuarios del mismo perfil.

## Clarifications

### Sesión 2026-06-23

- Q: ¿Cómo debe describir la especificación el comportamiento real de la migración de campos heredados? → A: La migración se ejecuta en cada lectura de forma idempotente (sin efecto si no hay campos heredados).
- Q: ¿Qué comportamiento debe documentar la especificación cuando el popup se cierra durante la generación del borrador? → A: El borrador SÍ se inserta en Gmail porque el service worker ejecuta las llamadas asíncronas (`chrome.tabs.create` + `chrome.tabs.sendMessage`) de forma independiente al popup; los logs del popup se pierden al cerrarlo.
- Q: ¿Cómo debe describir la especificación el comportamiento cuando el usuario ya tiene Gmail abierto en otra pestaña? → A: La extensión siempre crea una pestaña nueva de Gmail (vía `chrome.tabs.create`) sin reusar pestañas existentes, por lo que tras usos sucesivos el usuario puede tener varias pestañas de Gmail abiertas.
- Q: ¿Cómo debe precisar la especificación el alcance del removedor de firma de Gmail? → A: La extensión elimina únicamente los elementos con clase `.gmail_signature` o atributo `[data-smartmail='gmail_signature']`; el objetivo es evitar firmas en orden incorrecto, pero las firmas con marcado distinto pueden quedar duplicadas y requerir borrado manual por el usuario.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 — Activar la extensión en una pestaña de OneNote (Prioridad: P1)

Como usuario ya autenticado en OneNote Web desde el navegador, abro
una página de OneNote con texto estructurado y abro el popup de la
extensión para iniciar el flujo de generación de borrador.

**Por qué esta prioridad**: es el flujo de entrada del MVP; sin una
sesión de OneNote activa en el navegador, la extensión no puede leer
contenido y el flujo termina con un mensaje informativo.

**Prueba independiente**: la extensión debe poder iniciarse desde su
popup en cualquier pestaña donde OneNote Web esté cargado y la sesión
del navegador con OneNote esté activa, sin pedir credenciales.

**Escenarios de aceptación**:

1. **Dado** que el usuario tiene una pestaña activa en un host de la
   familia OneNote (OneNote/Office/SharePoint/OneDrive), **cuando** abre
   el popup de la extensión, **entonces** la extensión se muestra y
   permite continuar el flujo sin solicitar credenciales.
2. **Dado** que el usuario abre el popup en una pestaña que NO pertenece
   a los hosts declarados, **cuando** pulsa **Send email**, **entonces**
   la extensión devuelve mensajes que indican que la pestaña activa no
   es OneNote Web y NO se abre Gmail ni se inserta ningún borrador.
3. **Dado** que la pestaña activa es OneNote Web pero el contenido no
   devuelve texto visible (página en blanco, contenido en un marco
   inaccesible, sesión caducada), **cuando** la extensión intenta
   extraer texto, **entonces** devuelve mensajes explícitos de fallo de
   extracción y NO se abre Gmail.

---

### Historia de Usuario 2 — Componer un borrador de Gmail para revisión manual (Prioridad: P1)

Como usuario ya autenticado en Gmail en el navegador, pulso
**Send email** en el popup y la extensión abre la composición de Gmail
con el asunto y cuerpo HTML prellenados, para que yo los revise y envíe
manualmente.

**Por qué esta prioridad**: es el resultado final del MVP; sin un
borrador revisable en Gmail, la extensión no cumple su propósito.

**Prueba independiente**: tras pulsar **Send email**, Gmail debe quedar
con un borrador que incluye el asunto generado y el cuerpo HTML
derivado de la página de OneNote, listo para envío manual.

**Escenarios de aceptación**:

1. **Dado** que la pestaña activa es OneNote Web y la extracción fue
   exitosa, **cuando** el usuario pulsa **Send email**, **entonces** la
   extensión abre la composición de Gmail con un asunto y un cuerpo
   HTML insertados.
2. **Dado** que la composición de Gmail ya está abierta en otra pestaña,
   **cuando** se abre una nueva composición para insertar el borrador,
   **entonces** la extensión selecciona el cuadro de composición más
   reciente y lo usa como destino de la inserción.
3. **Dado** que el usuario tiene una firma automática configurada en
   Gmail, **cuando** la extensión inserta el cuerpo HTML, **entonces** la
   firma automática se elimina antes de la inserción para evitar
   duplicación.

---

### Historia de Usuario 3 — Configurar la extensión localmente (Prioridad: P2)

Como usuario, abro la página de opciones para editar mi configuración
local (URL de Gmail, arquitecto técnico, fallback de campos vacíos,
plantilla de URL del ticket, selectores de DOM de Gmail/OneNote, flags
y sobrescrituras de plantillas) sin que se me pida ninguna credencial.

**Por qué esta prioridad**: la configuración se almacena localmente y
modifica el comportamiento de la extensión; no es bloqueante pero es
necesaria para personalizar el flujo.

**Prueba independiente**: la página de opciones debe permitir editar y
guardar la configuración, y la configuración guardada debe persistir
entre recargas de la extensión y entre sesiones del navegador.

**Escenarios de aceptación**:

1. **Dado** que la extensión está instalada, **cuando** el usuario abre
   la página de opciones, **entonces** puede ver y editar todos los
   campos de configuración sin que se le solicite autenticación.
2. **Dado** que el usuario guarda cambios en la configuración,
   **cuando** recarga la extensión o reinicia el navegador, **entonces**
   los cambios guardados siguen vigentes.
3. **Dado** que el usuario pulsa **Restore defaults**, **cuando** se
   confirma la acción, **entonces** la configuración vuelve a los
   valores predeterminados de fábrica y se elimina del almacenamiento
   local.

---

### Historia de Usuario 4 — Conservar y migrar configuración entre formatos heredados (Prioridad: P3)

Como usuario que actualiza la extensión desde una versión anterior,
mantengo mi configuración previa (incluidos overrides antiguos de
plantilla almacenados a nivel global) sin tener que reintroducirla
manualmente.

**Por qué esta prioridad**: soporte de migración; no es funcionalidad
visible para nuevos usuarios, pero evita pérdida de datos en
actualizaciones.

**Prueba independiente**: al instalar una versión nueva sobre una
configuración previa en formato heredado, los campos heredados deben
quedar migrados al formato por plantilla y el comportamiento de la
extensión debe seguir siendo el esperado por el usuario.

**Escenarios de aceptación**:

1. **Dado** que el almacenamiento local contiene campos heredados de
   configuración de plantilla a nivel global, **cuando** la extensión lee
   la configuración, **entonces** esos campos quedan migrados al esquema
   por plantilla bajo la plantilla por defecto y se omiten del objeto
   principal; en lecturas sucesivas sin campos heredados, la migración
   no produce cambios (es idempotente).
2. **Dado** que el almacenamiento local solo contiene configuración en
   formato nuevo, **cuando** la extensión la lee, **entonces** no se
   aplica ninguna migración.

---

### Casos Límite

- ¿Qué ocurre si el usuario pulsa **Send email** sin tener ninguna
  pestaña activa de OneNote abierta? La extensión informa de que no se
  encontró pestaña activa y no abre Gmail.
- ¿Qué ocurre si el contenido de OneNote no devuelve texto visible
  (página en blanco, contenido en un iframe al que no se tiene acceso)?
  La extensión informa de que no se pudo extraer texto y no abre Gmail.
- ¿Qué ocurre si Gmail no abre una nueva pestaña de composición (URL
  inválida, error del navegador)? La extensión informa de que Gmail no
  pudo abrirse y devuelve los logs acumulados.
- ¿Qué ocurre si la pestaña de Gmail abre pero no se encuentra el
  cuadro de composición o el campo de asunto dentro del tiempo de
  espera? La extensión devuelve mensajes indicando el elemento que no
  se encontró y deja Gmail abierto para inspección manual.
- ¿Qué ocurre si el usuario ha revocado el permiso de almacenamiento
  local entre sesiones? La extensión cae en los valores por defecto y
  permite reconfigurar.
- ¿Qué ocurre si la extensión se reinstala o se actualiza limpiando el
  almacenamiento local? Los valores por defecto rigen y la
  configuración previa se pierde sin posibilidad de recuperación desde
  la propia extensión.
- ¿Qué ocurre si el usuario abre el popup en una pestaña no-OneNote y
  luego cambia a OneNote antes de pulsar **Send email**? La extensión
  lee la pestaña activa en el momento de pulsar **Send email**, no en
  el momento de abrir el popup.
- ¿Qué ocurre si dos pestañas distintas de OneNote están abiertas y la
  activa es una sin texto estructurado? La extensión usa solo la pestaña
  activa y devuelve mensajes de fallo si la extracción no produce
  texto.
- ¿Qué ocurre si otra extensión intenta leer o modificar la
  configuración persistida? La extensión no protege el almacenamiento
  local frente a otras extensiones con el permiso `storage`; el
  aislamiento entre extensiones es responsabilidad del navegador.
- ¿Qué ocurre si un usuario distinto usa el mismo perfil del navegador
  y abre la extensión? No existe separación por usuario dentro de la
  extensión; la configuración y el comportamiento son compartidos.
- ¿Qué ocurre si el usuario cierra el popup mientras el service worker
  está procesando el mensaje `GENERATE_GMAIL_DRAFT`? El flujo continúa
  de forma asíncrona: el borrador SÍ se inserta en Gmail (porque las
  llamadas del service worker son independientes del popup), pero los
  logs que se renderizarían en el popup se pierden al cerrarlo, ya que
  el componente React se desmonta antes de recibirlos.
- ¿Qué ocurre si el usuario ya tiene Gmail abierto en otra pestaña
  antes de pulsar **Send email**? La extensión siempre abre una pestaña
  nueva de Gmail (no reutiliza la existente), por lo que el usuario
  puede acumular varias pestañas de Gmail tras usos sucesivos.
- ¿Qué ocurre si la firma automática del usuario en Gmail usa un
  marcado distinto de `.gmail_signature` o
  `[data-smartmail='gmail_signature']` (por ejemplo, una firma
  personalizada en texto plano o con otra clase CSS)? La extensión NO
  la elimina y el resultado puede contener la firma duplicada o en
  orden incorrecto; el borrador sigue quedando listo para envío manual
  y el usuario puede borrar la firma manualmente.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: La extensión NO DEBE solicitar credenciales al usuario en
  ningún flujo (popup, opciones, generación de borrador, extracción,
  inserción).
- **FR-002**: La extensión DEBE operar exclusivamente sobre pestañas que
  coincidan con los hosts declarados: la familia OneNote (OneNote,
  Office, SharePoint, OneDrive) y Gmail. Para cualquier otra pestaña,
  la extensión DEBE rechazar silenciosamente la operación y devolver
  mensajes informativos, sin invocar la apertura de Gmail.
- **FR-003**: La extensión DEBE confiar en la sesión existente del
  navegador con OneNote y Gmail. NO DEBE implementar, validar, refrescar
  ni asumir la identidad del usuario más allá de lo que la sesión del
  navegador ya garantiza.
- **FR-004**: La extensión DEBE persistir la configuración del usuario
  en el almacenamiento local del navegador, bajo una clave única
  dedicada, y DEBE recuperar esa configuración al iniciarse.
- **FR-005**: La página de opciones DEBE permitir al usuario editar la
  configuración persistida, guardarla al pulsar **Save**, restaurarla a
  los valores por defecto al pulsar **Restore defaults**, y restaurar
  solo la plantilla seleccionada al pulsar **Restore selected template**;
  todo ello sin solicitar credenciales.
- **FR-006**: La extensión DEBE aplicar la migración de campos heredados
  de configuración de plantilla única al esquema por plantilla en cada
  lectura del almacenamiento local; la migración es idempotente y no
  produce cambios cuando no detecta campos heredados, preservando la
  experiencia del usuario existente sin intervención manual.
- **FR-007**: El popup DEBE permitir seleccionar entre las plantillas
  registradas (`estimation`, `scope`, `completedQa`) antes de iniciar la
  generación del borrador, sin solicitar credenciales.
- **FR-008**: La extensión DEBE abrir una nueva pestaña de composición de
  Gmail usando la URL configurada y, tras la apertura, DEBE insertar el
  asunto y el cuerpo HTML en el cuadro de composición más reciente
  visible en esa pestaña.
- **FR-009**: La extensión DEBE eliminar el bloque de firma automática
  reconocido por Gmail (elementos con clase `.gmail_signature` o
  atributo `[data-smartmail='gmail_signature']`) dentro del cuadro de
  composición antes de insertar el HTML generado, con el objetivo de
  evitar firmas duplicadas o en orden incorrecto en el caso de firmas
  con marcado estándar de Gmail.
- **FR-010**: La extensión NO DEBE persistir contenido de OneNote
  extraído, plantillas parseadas, ni cuerpos de correo generados en
  ningún medio (almacenamiento local, cookies, IndexedDB, red).

### Requisitos No Funcionales

- **NFR-001 (Privacidad)**: La extensión NO DEBE transmitir contenido de
  OneNote, configuración, ni datos derivados a ningún endpoint remoto.
  Toda la información permanece en el equipo del usuario.
- **NFR-002 (Seguridad por manifiesto)**: La frontera de seguridad de la
  extensión es la lista de hosts declarada en el manifiesto; cualquier
  intento de operar fuera de esa lista debe ser rechazado por el
  navegador antes de que la extensión ejecute código.
- **NFR-003 (Aislamiento de responsabilidad)**: La extensión NO DEBE
  asumir la identidad del usuario; el único responsable de
  autenticarse contra OneNote y Gmail es el navegador del usuario.
- **NFR-004 (Latencia del flujo)**: El flujo completo de extracción,
  parseo, renderizado, apertura de Gmail e inserción del borrador DEBE
  completarse en menos de 30 segundos para una página típica de
  OneNote.
- **NFR-005 (Persistencia local)**: La configuración guardada DEBE
  sobrevivir al cierre y reapertura del navegador y a recargas de la
  extensión.
- **NFR-006 (Compatibilidad de navegadores)**: El comportamiento
  descrito DEBE funcionar tanto en Chrome (MV3) como en Edge (MV3) sin
  diferencias funcionales visibles para el usuario.
- **NFR-007 (Trazabilidad para depuración)**: Todos los flujos
  importantes deben registrar mensajes de estado con prefijo emoji
  (`✅`, `⚠️`, `❌`, `ℹ️`) para que el usuario pueda diagnosticar fallos
  desde el popup sin abrir herramientas de desarrollo.

### Entidades Clave *(incluir si la funcionalidad involucra datos)*

- **Configuración de la extensión**: estado local persistido por el
  usuario (URL de Gmail, arquitecto técnico, fallback de campos vacíos,
  plantilla de URL del ticket, sobrescrituras por plantilla, selectores
  de DOM, flags). Sin credenciales, sin tokens, sin información
  personal identificable.
- **Pestaña activa**: pestaña actualmente seleccionada en la ventana
  actual del navegador; fuente única de contenido para la extracción
  de OneNote y destino para la apertura de Gmail. Determinada por el
  navegador, no por la extensión.
- **Plantilla de correo**: combinación inmutable de asunto, cuerpo,
  mapeos de campos y perfil de documentación; puede ser ampliada por el
  usuario vía overrides persistidos.
- **Sesión del navegador con OneNote / Gmail**: estado de
  autenticación mantenido por el navegador contra los hosts
  declarados. No es una entidad de la extensión; es una precondición
  externa.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: El 100% de los intentos de pulsar **Send email** desde una
  pestaña válida de OneNote Web con sesión iniciada generan un borrador
  en Gmail en menos de 30 segundos, listo para envío manual.
- **SC-002**: El 100% de los intentos desde una pestaña que no es
  OneNote Web finalizan con un mensaje informativo claro y sin abrir
  Gmail.
- **SC-003**: La configuración guardada en la página de opciones
  persiste tras cerrar y reabrir el navegador.
- **SC-004**: El 100% de los borradores generados no contienen firma
  automática de Gmail duplicada.
- **SC-005**: El 100% de las extracciones desde pestañas OneNote Web
  válidas devuelven al menos un campo parseado o un mensaje explícito
  de fallo de extracción.
- **SC-006**: Ningún dato de OneNote, configuración sensible ni
  credencial abandona el equipo del usuario: la extensión no realiza
  llamadas de red a endpoints distintos de los hosts OneNote/Gmail ya
  visitados por el usuario en su sesión normal del navegador.
- **SC-007**: El 100% de los flujos del usuario (abrir popup, enviar
  borrador, abrir opciones, guardar, restaurar) se completan sin
  solicitar credenciales en pantalla alguna.

## Suposiciones

- El usuario asume la responsabilidad de estar autenticado en OneNote
  Web y Gmail antes de usar la extensión; la extensión no valida, no
  fuerza ni recupera esta autenticación.
- La sesión del navegador con los hosts declarados es el único
  mecanismo válido de "autenticación" en el contexto de esta
  extensión; no existe cuenta de usuario, perfil ni identidad gestionada
  por la extensión.
- El modelo de seguridad se apoya en el aislamiento que el navegador
  provee a las extensiones y en la lista de hosts declarados en el
  manifiesto.
- La configuración almacenada en el almacenamiento local no contiene
  credenciales; contiene solo preferencias personalizables por el
  usuario y, según la constitución del proyecto, NO DEBE contener datos
  extraídos de OneNote ni borradores generados.
- El navegador bloquea la ejecución de la extensión fuera de los hosts
  declarados antes de que cualquier código del content script o del
  service worker pueda ejecutarse; este comportamiento del navegador es
  la garantía principal del modelo de confianza.