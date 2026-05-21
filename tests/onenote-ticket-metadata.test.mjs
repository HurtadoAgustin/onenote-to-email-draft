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
  ...buildTicketUrlTemplateData(defaultConfig, baseTemplateData)
};
const subject = renderTemplate(estimationTemplate.subjectTemplate, templateData);
const html = renderTemplate(estimationTemplate.bodyTemplate, templateData);

assert.equal(parsedData.choNumber, "CHO-012");
assert.equal(parsedData.ticketNumber, "T-12345");
assert.equal(parsedData.clientAndModule, "ACME AP");
assert.equal(parsedData.clientChoRequester, "Jane Doe");
assert.equal(parsedData.titulo, "New payment approval workflow");
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

const result = {
  parsedData,
  subject,
  ticketUrl: templateData.ticketUrl
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log("PASS: OneNote ticket metadata and ticket URL are parsed and rendered.");
console.log(JSON.stringify(result, null, 2));
