import type { ExtensionConfig, TemplateData } from "../types";

export const buildSignatureTemplateData = (config: ExtensionConfig): TemplateData => {
  const shouldInsertSignature = config.flags.insertSignature && config.signatureHtml.trim();
  const signatureSeparator = shouldInsertSignature
    ? '<br /><div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">--&nbsp;</div><br />'
    : "";
  const signature = shouldInsertSignature ? config.signatureHtml : "";

  return {
    signatureSeparator,
    signature,
    firmaSeparador: signatureSeparator,
    firma: signature
  };
};
