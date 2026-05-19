export type FieldMapping = {
  key: string;
  labels: string[];
  required?: boolean;
};

export type ExtensionConfig = {
  mailUrl: string;
  subjectTemplate: string;
  bodyTemplate: string;
  signatureHtml: string;
  fieldMappings: FieldMapping[];
  selectors: {
    oneNoteRoot?: string;
    outlookNewMailButton?: string;
    outlookSubject?: string;
    outlookBody?: string;
    outlookTo?: string;
  };
  flags: {
    autoOpenCompose: boolean;
    insertSignature: boolean;
    allowIncompleteFields: boolean;
  };
};

export type OneNoteExtractResponse = {
  ok: boolean;
  text?: string;
  logs: string[];
};

export type OutlookInsertResponse = {
  ok: boolean;
  logs: string[];
};

export type GenerateMailResponse = {
  ok: boolean;
  logs: string[];
};

export type ParsedDataResult = {
  data: Record<string, string>;
  logs: string[];
  missingRequiredFields: string[];
};
