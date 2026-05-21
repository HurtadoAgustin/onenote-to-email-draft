import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  emailTemplates,
  getEmailTemplateForConfig
} from "../templateRegistry";
import type { EmailTemplateId, EmailTemplateOverride } from "../templateRegistry/types";
import { defaultConfig, getConfig, resetConfig, saveConfig } from "../utils/config";
import type {
  ExtensionConfig,
  ExtensionFlags,
  ExtensionSelectors,
  FieldMapping
} from "../utils/types";
import "./styles.css";

const parseJsonField = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const buildTemplateOverride = (
  subjectTemplate: string,
  bodyTemplate: string,
  fieldMappings: FieldMapping[]
): EmailTemplateOverride => ({
  subjectTemplate,
  bodyTemplate,
  fieldMappings
});

const App = () => {
  const [config, setConfig] = useState<ExtensionConfig>(defaultConfig);
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateId>("estimation");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [fieldMappingsJson, setFieldMappingsJson] = useState("");
  const [selectorsJson, setSelectorsJson] = useState("");
  const [flagsJson, setFlagsJson] = useState("");
  const [status, setStatus] = useState("Loading settings...");

  const selectedTemplate = useMemo(
    () => getEmailTemplateForConfig(selectedTemplateId, config.templateOverrides),
    [config.templateOverrides, selectedTemplateId]
  );

  const loadTemplateEditor = (
    templateId: EmailTemplateId,
    currentConfig: ExtensionConfig
  ) => {
    const template = getEmailTemplateForConfig(templateId, currentConfig.templateOverrides);

    setSelectedTemplateId(templateId);
    setSubjectTemplate(template.subjectTemplate);
    setBodyTemplate(template.bodyTemplate);
    setFieldMappingsJson(JSON.stringify(template.fieldMappings, null, 2));
  };

  useEffect(() => {
    void getConfig().then(loadedConfig => {
      setConfig(loadedConfig);
      loadTemplateEditor("estimation", loadedConfig);
      setSelectorsJson(JSON.stringify(loadedConfig.selectors, null, 2));
      setFlagsJson(JSON.stringify(loadedConfig.flags, null, 2));
      setStatus("Settings loaded");
    });
  }, []);

  const updateConfigField = <TKey extends keyof ExtensionConfig>(
    key: TKey,
    value: ExtensionConfig[TKey]
  ) => {
    setConfig(currentConfig => ({
      ...currentConfig,
      [key]: value
    }));
  };

  const changeSelectedTemplate = (templateId: EmailTemplateId) => {
    loadTemplateEditor(templateId, config);
  };

  const save = async () => {
    const parsedFieldMappings = parseJsonField<FieldMapping[]>(
      fieldMappingsJson,
      selectedTemplate.fieldMappings
    );

    const updatedConfig: ExtensionConfig = {
      ...config,
      templateOverrides: {
        ...config.templateOverrides,
        [selectedTemplateId]: buildTemplateOverride(
          subjectTemplate,
          bodyTemplate,
          parsedFieldMappings
        )
      },
      selectors: parseJsonField<ExtensionSelectors>(selectorsJson, config.selectors),
      flags: parseJsonField<ExtensionFlags>(flagsJson, config.flags)
    };

    await saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setStatus("✅ Settings saved");
  };

  const resetSelectedTemplate = () => {
    const updatedConfig: ExtensionConfig = {
      ...config,
      templateOverrides: {
        ...config.templateOverrides,
        [selectedTemplateId]: undefined
      }
    };

    const cleanedOverrides = Object.fromEntries(
      Object.entries(updatedConfig.templateOverrides).filter(([, value]) => Boolean(value))
    ) as ExtensionConfig["templateOverrides"];

    const cleanedConfig = {
      ...updatedConfig,
      templateOverrides: cleanedOverrides
    };

    setConfig(cleanedConfig);
    loadTemplateEditor(selectedTemplateId, cleanedConfig);
    setStatus("Template restored locally. Save to persist the change.");
  };

  const reset = async () => {
    const restoredConfig = await resetConfig();
    setConfig(restoredConfig);
    loadTemplateEditor("estimation", restoredConfig);
    setSelectorsJson(JSON.stringify(restoredConfig.selectors, null, 2));
    setFlagsJson(JSON.stringify(restoredConfig.flags, null, 2));
    setStatus("✅ Settings restored");
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Settings</h1>
        <p>Local settings for OneNote to Mail Draft.</p>
      </header>

      <section className="card">
        <h2>General settings</h2>

        <label>
          URL Gmail
          <input
            value={config.mailUrl}
            onChange={event => updateConfigField("mailUrl", event.target.value)}
          />
        </label>

        <label>
          HTML signature
          <textarea
            rows={4}
            value={config.signatureHtml}
            onChange={event => updateConfigField("signatureHtml", event.target.value)}
          />
        </label>

        <label>
          Fill empty fields with
          <input
            placeholder="Example: N/A"
            value={config.emptyFieldFallback}
            onChange={event => updateConfigField("emptyFieldFallback", event.target.value)}
          />
        </label>

        <label>
          Ticket URL template
          <input
            value={config.ticketUrlTemplate}
            onChange={event => updateConfigField("ticketUrlTemplate", event.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <h2>Email templates</h2>

        <div className="templateTabs">
          {emailTemplates.map(template => (
            <button
              className={template.id === selectedTemplateId ? "tabButton active" : "tabButton"}
              key={template.id}
              onClick={() => changeSelectedTemplate(template.id)}
              type="button"
            >
              {template.label}
            </button>
          ))}
        </div>

        <p className="templateDescription">{selectedTemplate.description}</p>

        <label>
          Subject template
          <input
            value={subjectTemplate}
            onChange={event => setSubjectTemplate(event.target.value)}
          />
        </label>

        <label>
          Body HTML template
          <textarea
            rows={12}
            value={bodyTemplate}
            onChange={event => setBodyTemplate(event.target.value)}
          />
        </label>

        <label>
          Field mappings JSON
          <textarea
            rows={10}
            value={fieldMappingsJson}
            onChange={event => setFieldMappingsJson(event.target.value)}
          />
        </label>

        <button className="secondaryButton inlineButton" onClick={resetSelectedTemplate} type="button">
          Restore selected template
        </button>
      </section>

      <section className="card">
        <h2>Advanced options</h2>

        <label>
          Selectors JSON
          <textarea
            rows={7}
            value={selectorsJson}
            onChange={event => setSelectorsJson(event.target.value)}
          />
        </label>

        <label>
          Flags JSON
          <textarea
            rows={5}
            value={flagsJson}
            onChange={event => setFlagsJson(event.target.value)}
          />
        </label>
      </section>

      <footer className="footer">
        <button className="primaryButton" onClick={save}>Save</button>
        <button className="secondaryButton" onClick={reset}>Restore defaults</button>
        <span>{status}</span>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
