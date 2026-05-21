# OneNote to Mail Draft

Chrome/Edge extension to extract structured data from OneNote Web and generate a reviewable Gmail draft, fully client-side and without backend or AI.

## MVP flow

1. Open a OneNote Web page with structured text.
2. Click the extension popup.
3. Click **Send email**.
4. The extension reads the current OneNote tab.
5. It parses mapped fields.
6. It opens Gmail compose.
7. It inserts subject and HTML body.
8. The user reviews and sends manually.

## Setup

```bash
npm install
npm run build
```

Load the `dist` folder as an unpacked extension from:

- Chrome: `chrome://extensions`
- Edge: `edge://extensions`

## Example OneNote content

```txt
Client: ACME
Ticket: INC-2031
Issue: Authentication error
Resolution: Service restart
```

## Privacy

This MVP stores only configuration in `chrome.storage.local`.
It does not store extracted OneNote data and does not send data to a backend.
