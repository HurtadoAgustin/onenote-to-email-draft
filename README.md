# OneNote Draft Bridge

Extensión Chrome/Edge Manifest V3 para generar un draft HTML en Outlook/Mail2 a partir de una página OneNote Web abierta.

## Objetivo del MVP

- Leer la página OneNote activa desde el DOM renderizado.
- Parsear campos estructurados del tipo `Campo: valor`.
- Reemplazar placeholders en un template HTML.
- Abrir Outlook/Mail2 Web.
- Insertar subject y body HTML en el compose.
- Dejar el mail en draft para revisión/envío manual.

## Requisitos

- Node.js 20 o superior recomendado.
- Chrome o Edge.
- Usuario logueado previamente en OneNote Web y Outlook/Mail2 Web.

## Instalación

```bash
npm install
npm run build
```

## Cargar en Chrome

1. Abrir `chrome://extensions`.
2. Activar `Developer mode`.
3. Click en `Load unpacked`.
4. Seleccionar la carpeta `dist` generada por `npm run build`.

## Cargar en Edge

1. Abrir `edge://extensions`.
2. Activar `Developer mode`.
3. Click en `Load unpacked`.
4. Seleccionar la carpeta `dist`.

## Prueba rápida

1. Abrir una página OneNote Web que tenga contenido como:

```txt
Cliente: ACME
Ticket: INC-2031
Problema: Error de autenticación
Resolución: Reinicio de servicio
```

2. Click en el ícono de la extensión.
3. Click en `Generar mail`.
4. La extensión abre Outlook/Mail2.
5. El draft queda preparado para revisión manual.

## Settings

Desde el popup, entrar en `Settings`.

Se puede configurar:

- URL de Mail2/Outlook.
- Subject template.
- Body HTML template.
- Firma HTML.
- Mappings de campos.
- Selectores DOM.
- Flags.

La configuración se guarda localmente en `chrome.storage.local`.

## Placeholders

Usar placeholders con doble llave:

```txt
{{cliente}}
{{ticket}}
{{problema}}
{{resolucion}}
{{firma}}
```

## Importante para Mail2 interno

Si Mail2 usa un dominio distinto a Outlook, agregar ese dominio en:

- `public/manifest.json` → `host_permissions`.
- `public/manifest.json` → `content_scripts[1].matches`.

Ejemplo:

```json
"https://mail2.miempresa.com/*"
```

Luego ejecutar nuevamente:

```bash
npm run build
```

Y recargar la extensión desde `chrome://extensions` o `edge://extensions`.

## Limitaciones conocidas

- Outlook/Mail2 Web puede cambiar selectores internos.
- El compose renderiza async, por eso se usa espera con `MutationObserver`.
- No se envía el mail automáticamente.
- No se guardan datos extraídos del documento, solo configuración.
- Si una pestaña OneNote ya estaba abierta antes de instalar la extensión, puede requerir refrescar la página o volver a ejecutar el botón.
