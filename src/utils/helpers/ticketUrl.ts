import type { ExtensionConfig, TemplateData, TemplateValue } from "../types";

const stringifyTemplateValue = (value: TemplateValue | undefined): string => {
  if (Array.isArray(value)) {
    return value.map(item => item.text).join(" ").trim();
  }

  return value?.trim() ?? "";
};

const getTicketNumberId = (ticketNumber: string): string =>
  ticketNumber.replace(/^T\s*-\s*/i, "").trim();

const buildTicketUrlReplacementData = (data: TemplateData): Record<string, string> => {
  const ticketDisplayNumber = stringifyTemplateValue(data.ticketNumber);
  const ticketNumberId = getTicketNumberId(ticketDisplayNumber);
  const stringifiedData = Object.entries(data).reduce<Record<string, string>>(
    (acc, [key, value]) => ({
      ...acc,
      [key]: stringifyTemplateValue(value)
    }),
    {}
  );

  return {
    ...stringifiedData,
    ticketNumber: ticketNumberId,
    ticketNumberId,
    ticketDisplayNumber
  };
};

export const renderTicketUrl = (
  ticketUrlTemplate: string,
  data: TemplateData
): string => {
  const replacementData = buildTicketUrlReplacementData(data);

  return ticketUrlTemplate.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: string) =>
    encodeURIComponent(replacementData[key] ?? "")
  );
};

export const buildTicketUrlTemplateData = (
  config: ExtensionConfig,
  data: TemplateData
): TemplateData => ({
  ticketUrl: renderTicketUrl(config.ticketUrlTemplate, data)
});
