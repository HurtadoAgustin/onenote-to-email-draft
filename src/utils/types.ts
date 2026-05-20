export type FieldMapping = {
  key: string;
  labels: string[];
  required?: boolean;
};

export type ExtensionSelectors = {
  oneNoteRoot?: string;
  gmailComposeDialog?: string;
  gmailSubject?: string;
  gmailBody?: string;
};

export type ExtensionFlags = {
  insertSignature: boolean;
  allowIncompleteFields: boolean;
};

export type ExtensionConfig = {
  mailUrl: string;
  subjectTemplate: string;
  bodyTemplate: string;
  signatureHtml: string;
  emptyFieldFallback: string;
  fieldMappings: FieldMapping[];
  selectors: ExtensionSelectors;
  flags: ExtensionFlags;
};

export type GenerateDraftResponse = {
  ok: boolean;
  logs: string[];
};

export type ExtractOneNoteResponse = {
  ok: boolean;
  text?: string;
  logs: string[];
};

export type InsertGmailDraftResponse = {
  ok: boolean;
  logs: string[];
};

export type GenerateDraftPayload = {
  type: "GENERATE_GMAIL_DRAFT";
};

export type ExtractOneNotePayload = {
  type: "EXTRACT_ONENOTE_TEXT";
  config: ExtensionConfig;
};

export type InsertGmailDraftPayload = {
  type: "INSERT_GMAIL_DRAFT";
  subject: string;
  html: string;
  config: ExtensionConfig;
};

export type RuntimeMessage =
  | GenerateDraftPayload
  | ExtractOneNotePayload
  | InsertGmailDraftPayload;
