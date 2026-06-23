# OneNote to Mail Draft

Extensión para Chrome/Edge que extrae datos estructurados de OneNote Web
y genera un borrador revisable de Gmail, completamente del lado del
cliente, sin backend ni IA.

## Flujo del MVP

1. Abrir una página de OneNote Web con texto estructurado.
2. Hacer clic en el popup de la extensión.
3. Hacer clic en **Send email**.
4. La extensión lee la pestaña activa de OneNote.
5. Parsea los campos mapeados.
6. Abre la composición de Gmail.
7. Inserta el asunto y el cuerpo HTML.
8. El usuario revisa y envía manualmente.

## Instalación

```bash
npm install
npm run build
```

Cargar la carpeta `dist` como extensión sin empaquetar desde:

- Chrome: `chrome://extensions`
- Edge: `edge://extensions`

## Ejemplo de Contenido de OneNote

```txt
Client: ACME
Ticket: INC-2031
Issue: Authentication error
Resolution: Service restart
```

## Privacidad

Este MVP almacena únicamente configuración en `chrome.storage.local`.
No guarda datos extraídos de OneNote y no envía datos a ningún backend.