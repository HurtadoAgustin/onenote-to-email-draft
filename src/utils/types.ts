export type EmailTemplateId = "estimation" | "scope" | "completedQa";

export type FieldMapping = {
  key: string;
  labels: string[];
  required?: boolean;
};

export type DocumentationProfile = {
  id: "changeOrder";
  sectionHeadings: Record<string, string[]>;
  listFieldKeys: string[];
};

export type EmailTemplateOverride = Partial<{
  subjectTemplate: string;
  bodyTemplate: string;
  fieldMappings: FieldMapping[];
}>;

export type EmailTemplate = {
  id: EmailTemplateId;
  label: string;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
  fieldMappings: FieldMapping[];
  documentationProfile: DocumentationProfile;
};

export type ParsedListItem = {
  text: string;
  level: number;
};

export type OneNoteDomTextItem = {
  index: number;
  text: string;
  closestListText: string;
  className: string;
  tagName: string;
  rectLeft: number;
  listItemRectLeft: number;
  markerRectLeft: number;
  markerMarginLeft: number;
  computedLevelHint: number;
  ariaLevel: number;
  listStyleType: string;
};

export type TemplateValue = string | ParsedListItem[];

export type TemplateData = Record<string, TemplateValue>;

export type ExtensionSelectors = {
  oneNoteRoot?: string;
  gmailComposeDialog?: string;
  gmailSubject?: string;
  gmailBody?: string;
};

export type ExtensionFlags = {
  allowIncompleteFields: boolean;
};

export type ExtensionConfig = {
  mailUrl: string;
  technicalArchitect: string;
  emptyFieldFallback: string;
  ticketUrlTemplate: string;
  templateOverrides: Partial<Record<EmailTemplateId, EmailTemplateOverride>>;
  selectors: ExtensionSelectors;
  flags: ExtensionFlags;
};

export type LegacyExtensionConfig = Partial<ExtensionConfig> & {
  subjectTemplate?: string;
  bodyTemplate?: string;
  fieldMappings?: FieldMapping[];
};

export type GenerateDraftResponse = {
  ok: boolean;
  logs: string[];
};

export type ExtractOneNoteResponse = {
  ok: boolean;
  text?: string;
  domTextItems?: OneNoteDomTextItem[];
  logs: string[];
};

export type InsertGmailDraftResponse = {
  ok: boolean;
  logs: string[];
};

export type GenerateDraftPayload = {
  type: "GENERATE_GMAIL_DRAFT";
  templateId: EmailTemplateId;
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
