import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const fixturePath = path.resolve("tests/fixtures/onenote-ticket-metadata-sample.txt");
const outputPath = path.resolve("tests/outputs/onenote-ticket-metadata-result.json");
const testBundlePath = path.resolve("tests/.tmp/ticket-metadata-runtime.mjs");

fs.mkdirSync(path.dirname(testBundlePath), { recursive: true });

await build({
  stdin: {
    contents: `
      export { defaultConfig } from "./src/utils/config.ts";
      export { parseStructuredText } from "./src/utils/parser.ts";
      export { renderTemplate } from "./src/utils/template.ts";
      export { buildTicketUrlTemplateData } from "./src/utils/helpers/ticketUrl.ts";
      export { buildEstimationBreakdownTemplateData } from "./src/utils/helpers/estimationBreakdown.ts";
      export { estimationTemplate } from "./src/templates/estimation.ts";
    `,
    resolveDir: process.cwd(),
    loader: "ts"
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: testBundlePath
});

const {
  buildEstimationBreakdownTemplateData,
  buildTicketUrlTemplateData,
  defaultConfig,
  estimationTemplate,
  parseStructuredText,
  renderTemplate
} = await import(`${pathToFileURL(testBundlePath).href}?cache=${Date.now()}`);
const fixture = fs.readFileSync(fixturePath, "utf8");
const parsedData = parseStructuredText(fixture, []);
const baseTemplateData = {
  ...parsedData,
  templateType: estimationTemplate.label,
  TemplateType: estimationTemplate.label
};
const templateData = {
  ...baseTemplateData,
  ...buildTicketUrlTemplateData(defaultConfig, baseTemplateData),
  ...buildEstimationBreakdownTemplateData(estimationTemplate.id)
};
const subject = renderTemplate(estimationTemplate.subjectTemplate, templateData);
const html = renderTemplate(estimationTemplate.bodyTemplate, templateData);

assert.equal(parsedData.choNumber, "CHO-012");
assert.equal(parsedData.ticketNumber, "T-12345");
assert.equal(parsedData.clientAndModule, "ACME AP");
assert.equal(parsedData.clientChoRequester, "Jane Doe");
assert.equal(parsedData.titulo, "New payment approval workflow");
assert.deepEqual(parsedData.integracion, [
  {
    text: "The ERP should receive the approval status.",
    level: 0
  }
]);
assert.doesNotMatch(
  JSON.stringify(parsedData.integracion),
  /Update Considerations|Design notes|Technical Conditions|internal implementation|Estimation breakdown/
);
assert.equal(subject, "[Esker-ACME AP][Estimación] T-12345 - New payment approval workflow");
assert.equal(
  templateData.ticketUrl,
  "https://request-sa2.odoo.com/web#id=12345&menu_id=87&cids=1&action=140&model=project.task&view_type=form"
);
assert.match(
  html,
  /correspondiente al ticket <a href="https:\/\/request-sa2\.odoo\.com\/web#id=12345&amp;menu_id=87&amp;cids=1&amp;action=140&amp;model=project\.task&amp;view_type=form"[^>]*>T-12345<\/a>/
);
assert.match(html, /La misma deberá ser enviada a Jane Doe\./);
assert.deepEqual(parsedData.technicalConditions, [
  {
    text: "Use a feature toggle for the approval workflow.",
    level: 0
  },
  {
    text: "This internal subcondition should stay nested.",
    level: 1
  }
]);
assert.deepEqual(parsedData.additionalContext, [
  {
    text: "Coordinate the deployment window with ACME.",
    level: 0
  }
]);
assert.match(html, /Internal context \(not to be shared with customer\)/);
assert.match(html, /Technical Conditions/);
assert.match(html, /Additional context/);
assert.match(html, /Estimation breakdown/);
assert.match(html, /<table[\s\S]*Task[\s\S]*Hours[\s\S]*Total[\s\S]*<\/table>/);
assert.doesNotMatch(html, /data:image\/png;base64/);
assert.ok(
  html.indexOf("Condiciones de Integración con el ERP") < html.indexOf("Internal context (not to be shared with customer)"),
  "The internal context section should be rendered after ERP integration conditions."
);

const result = {
  parsedData,
  subject,
  ticketUrl: templateData.ticketUrl,
  technicalConditions: parsedData.technicalConditions,
  additionalContext: parsedData.additionalContext
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log("PASS: OneNote ticket metadata and ticket URL are parsed and rendered.");
console.log(JSON.stringify(result, null, 2));
