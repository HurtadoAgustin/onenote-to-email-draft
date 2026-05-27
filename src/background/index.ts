import { getEmailTemplateForConfig } from "../templateRegistry";
import { getConfig } from "../utils/config";
import { getActiveTab, sendMessageToTab } from "../utils/helpers/chrome";
import { getErrorMessage } from "../utils/helpers/error";
import { extractOneNoteTextFromTab } from "../utils/helpers/onenoteExtraction";
import { buildEstimationBreakdownTemplateData } from "../utils/helpers/estimationBreakdown";
import { buildTicketUrlTemplateData } from "../utils/helpers/ticketUrl";
import {
  applyEmptyFieldFallback,
  buildFoundFieldLogs
} from "../utils/helpers/templateData";
import {
  applyDomListLevelHints,
  getMissingRequiredFields,
  parseStructuredText
} from "../utils/parser";
import { renderTemplate } from "../utils/template";
import type {
  GenerateDraftResponse,
  InsertGmailDraftResponse,
  RuntimeMessage
} from "../utils/types";

const generateGmailDraft = async (
  message: RuntimeMessage
): Promise<GenerateDraftResponse> => {
  if (message.type !== "GENERATE_GMAIL_DRAFT") {
    return {
      ok: false,
      logs: ["❌ Invalid message type"]
    };
  }

  const config = await getConfig();
  const template = getEmailTemplateForConfig(
    message.templateId,
    config.templateOverrides
  );
  const activeTab = await getActiveTab();

  if (!activeTab?.id) {
    return {
      ok: false,
      logs: ["❌ Active tab not found"]
    };
  }

  const oneNoteResponse = await extractOneNoteTextFromTab(
    activeTab.id,
    config.selectors.oneNoteRoot
  );

  if (!oneNoteResponse.ok || !oneNoteResponse.text) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        "Check that the active tab is OneNote Web and that the domain is allowed in manifest.json"
      ]
    };
  }

  const parsedData = applyDomListLevelHints(
    parseStructuredText(
      oneNoteResponse.text,
      template.fieldMappings,
      template.documentationProfile
    ),
    oneNoteResponse.domTextItems,
    template.documentationProfile
  );
  const data = {
    ...parsedData,
    templateType: template.label,
    TemplateType: template.label
  };
  const missingRequiredFields = getMissingRequiredFields(
    data,
    template.fieldMappings
  );
  const getTemplatePlaceholderKeys = (...templates: string[]): string[] =>
    Array.from(
      new Set(
        templates.flatMap(templateText =>
          Array.from(templateText.matchAll(/{{\s*([\w.-]+)\s*}}/g)).map(match => match[1])
        )
      )
    );

  const fieldKeys = Array.from(
    new Set([
      ...template.fieldMappings.map(mapping => mapping.key),
      ...getTemplatePlaceholderKeys(template.subjectTemplate, template.bodyTemplate)
    ])
  ).filter(key => key !== "technicalArchitect");
  const fieldLogs = buildFoundFieldLogs(data, template.fieldMappings);
  const computedTemplateData = {
    ...data,
    ...buildTicketUrlTemplateData(config, data),
    ...buildEstimationBreakdownTemplateData(template.id)
  };
  const dataForTemplate = applyEmptyFieldFallback(
    computedTemplateData,
    fieldKeys,
    config.emptyFieldFallback
  );
  const formattedTechnicalArchitect = config.technicalArchitect.trim()
    ? ` ${config.technicalArchitect.trim()}`
    : "";

  console.log("Selected email template:", template.id);
  console.log("Parsed OneNote data:", data);
  console.log("Data used for Gmail template:", dataForTemplate);

  if (missingRequiredFields.length && !config.flags.allowIncompleteFields) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        `ℹ️ Selected template: ${template.label}`,
        ...fieldLogs,
        `❌ Missing required fields: ${missingRequiredFields.join(", ")}`
      ]
    };
  }

  const subject = renderTemplate(template.subjectTemplate, dataForTemplate);
  const html = renderTemplate(template.bodyTemplate, {
    ...dataForTemplate,
    technicalArchitect: formattedTechnicalArchitect
  });

  const gmailTab = await chrome.tabs.create({
    url: config.mailUrl,
    active: true
  });

  if (!gmailTab.id) {
    return {
      ok: false,
      logs: [
        ...oneNoteResponse.logs,
        `ℹ️ Selected template: ${template.label}`,
        ...fieldLogs,
        "❌ Gmail could not be opened"
      ]
    };
  }

  const gmailResponse = await sendMessageToTab<InsertGmailDraftResponse>(
    gmailTab.id,
    {
      type: "INSERT_GMAIL_DRAFT",
      subject,
      html,
      config
    },
    20,
    1000
  ).catch(error => ({
    ok: false,
    logs: [
      "❌ Gmail draft could not be inserted",
      getErrorMessage(error)
    ]
  }));

  return {
    ok: gmailResponse.ok,
    logs: [
      ...oneNoteResponse.logs,
      `ℹ️ Selected template: ${template.label}`,
      ...fieldLogs,
      ...gmailResponse.logs
    ]
  };
};

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type !== "GENERATE_GMAIL_DRAFT") return false;

    void generateGmailDraft(message)
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          ok: false,
          logs: [
            "❌ Unexpected error while generating the draft",
            getErrorMessage(error)
          ]
        });
      });

    return true;
  }
);
