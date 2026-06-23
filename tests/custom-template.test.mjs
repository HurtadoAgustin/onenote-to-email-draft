import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const testBundlePath = path.resolve("tests/.tmp/custom-template-runtime.mjs");

fs.mkdirSync(path.dirname(testBundlePath), { recursive: true });

await build({
  stdin: {
    contents: `
      export {
        createCustomTemplate,
        validateCustomTemplate,
        isValidCustomTemplate
      } from "./src/utils/helpers/customTemplate.ts";
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
  createCustomTemplate,
  validateCustomTemplate,
  isValidCustomTemplate
} = await import(`${pathToFileURL(testBundlePath).href}?cache=${Date.now()}`);

const newTemplate = createCustomTemplate();
assert.ok(typeof newTemplate.id === "string" && newTemplate.id.length > 0, "createCustomTemplate returns non-empty id");
assert.match(newTemplate.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "createCustomTemplate returns UUID format");
assert.equal(newTemplate.label, "", "label defaults to empty");
assert.equal(newTemplate.description, "", "description defaults to empty");
assert.equal(newTemplate.subjectTemplate, "", "subjectTemplate defaults to empty");
assert.equal(newTemplate.bodyTemplate, "", "bodyTemplate defaults to empty");
assert.deepEqual(newTemplate.fieldMappings, [], "fieldMappings defaults to empty array");
assert.ok(newTemplate.documentationProfile, "documentationProfile is set");

const anotherTemplate = createCustomTemplate();
assert.notEqual(newTemplate.id, anotherTemplate.id, "createCustomTemplate produces unique ids");

const valid = createCustomTemplate();
valid.label = "Mi plantilla";
valid.subjectTemplate = "[{{clientAndModule}}] {{ticketNumber}}";
valid.bodyTemplate = "<p>Hola</p>";
const validResult = validateCustomTemplate(valid, []);
assert.deepEqual(validResult, { ok: true }, "valid template passes validation");

const emptyLabel = createCustomTemplate();
emptyLabel.subjectTemplate = "[{{ticketNumber}}]";
const emptyLabelResult = validateCustomTemplate(emptyLabel, []);
assert.equal(emptyLabelResult.ok, false, "empty label fails validation");
if (!emptyLabelResult.ok) {
  assert.match(emptyLabelResult.error, /label/i, "error mentions label");
}

const emptySubject = createCustomTemplate();
emptySubject.label = "OK";
const emptySubjectResult = validateCustomTemplate(emptySubject, []);
assert.equal(emptySubjectResult.ok, false, "empty subjectTemplate fails validation");
if (!emptySubjectResult.ok) {
  assert.match(emptySubjectResult.error, /subject/i, "error mentions subject");
}

const bodyEmpty = createCustomTemplate();
bodyEmpty.label = "OK";
bodyEmpty.subjectTemplate = "[x]";
bodyEmpty.bodyTemplate = "";
const bodyEmptyResult = validateCustomTemplate(bodyEmpty, []);
assert.deepEqual(bodyEmptyResult, { ok: true }, "empty body is allowed");

const builtInCollision = createCustomTemplate();
builtInCollision.id = "estimation";
builtInCollision.label = "OK";
builtInCollision.subjectTemplate = "[x]";
const builtInCollisionResult = validateCustomTemplate(builtInCollision, []);
assert.equal(builtInCollisionResult.ok, false, "id colliding with built-in fails validation");

const duplicateId = createCustomTemplate();
duplicateId.id = newTemplate.id;
duplicateId.label = "OK";
duplicateId.subjectTemplate = "[x]";
const duplicateResult = validateCustomTemplate(duplicateId, [newTemplate.id]);
assert.equal(duplicateResult.ok, false, "duplicate id fails validation");

const missingId = createCustomTemplate();
missingId.id = "";
missingId.label = "OK";
missingId.subjectTemplate = "[x]";
const missingIdResult = validateCustomTemplate(missingId, []);
assert.equal(missingIdResult.ok, false, "empty id fails validation");

assert.equal(isValidCustomTemplate(null), false, "null is not valid");
assert.equal(isValidCustomTemplate(undefined), false, "undefined is not valid");
assert.equal(isValidCustomTemplate({}), false, "empty object is not valid");
assert.equal(isValidCustomTemplate({ id: "x" }), false, "object missing required fields is not valid");
assert.equal(isValidCustomTemplate({ ...newTemplate, id: "x" }), true, "complete template is valid");

console.log("PASS: Custom template helpers (create, validate, isValid) work as documented.");
