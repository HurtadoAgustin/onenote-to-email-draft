import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  emailTemplates,
  getEmailTemplateForConfig
} from "../templateRegistry";
import type { EmailTemplate, EmailTemplateId, EmailTemplateOverride } from "../utils/types";
import { defaultConfig, getConfig, resetConfig, saveConfig } from "../utils/config";
import type {
  ExtensionConfig,
  ExtensionFlags,
  ExtensionSelectors,
  FieldMapping
} from "../utils/types";
import {
  createCustomTemplate,
  validateCustomTemplate
} from "../utils/helpers/customTemplate";
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
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>([]);
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => getEmailTemplateForConfig(selectedTemplateId, config.templateOverrides),
    [config.templateOverrides, selectedTemplateId]
  );

  const selectedCustomTemplate = useMemo(
    () =>
      selectedCustomTemplateId
        ? customTemplates.find(t => t.id === selectedCustomTemplateId) ?? null
        : null,
    [customTemplates, selectedCustomTemplateId]
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
      setCustomTemplates(loadedConfig.customTemplates ?? []);
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

  const addCustomTemplate = () => {
    const newTemplate = createCustomTemplate();
    setCustomTemplates(prev => [...prev, newTemplate]);
    setSelectedCustomTemplateId(newTemplate.id);
  };

  const selectCustomTemplate = (id: string) => {
    setSelectedCustomTemplateId(id);
  };

  const updateCustomTemplateField = <K extends keyof EmailTemplate>(
    field: K,
    value: EmailTemplate[K]
  ) => {
    if (!selectedCustomTemplateId) return;
    setCustomTemplates(prev =>
      prev.map(t =>
        t.id === selectedCustomTemplateId ? { ...t, [field]: value } : t
      )
    );
  };

  const deleteCustomTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedCustomTemplateId === id) {
      setSelectedCustomTemplateId(null);
    }
  };

  const save = async () => {
    const parsedFieldMappings = parseJsonField<FieldMapping[]>(
      fieldMappingsJson,
      selectedTemplate.fieldMappings
    );

    for (const template of customTemplates) {
      const otherIds = customTemplates
        .filter(t => t.id !== template.id)
        .map(t => t.id);
      const result = validateCustomTemplate(template, otherIds);
      if (!result.ok) {
        setStatus(`❌ ${result.error}`);
        return;
      }
    }

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
      customTemplates,
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
    setCustomTemplates(restoredConfig.customTemplates ?? []);
    setSelectorsJson(JSON.stringify(restoredConfig.selectors, null, 2));
    setFlagsJson(JSON.stringify(restoredConfig.flags, null, 2));
    setSelectedCustomTemplateId(null);
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
          Technical architect
          <input
            value={config.technicalArchitect}
            onChange={event => updateConfigField("technicalArchitect", event.target.value)}
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
        <h2>Custom templates</h2>
        <p className="templateDescription">
          Create your own email templates. They appear in the popup alongside the built-in templates.
        </p>

        {customTemplates.length === 0 ? (
          <p>No custom templates yet.</p>
        ) : (
          <>
            <div className="templateTabs">
              {customTemplates.map(template => (
                <button
                  className={
                    template.id === selectedCustomTemplateId
                      ? "tabButton active"
                      : "tabButton"
                  }
                  key={template.id}
                  onClick={() => selectCustomTemplate(template.id)}
                  type="button"
                >
                  {template.label || "(sin etiqueta)"}
                </button>
              ))}
            </div>

            {selectedCustomTemplate && (
              <>
                <label>
                  Label
                  <input
                    value={selectedCustomTemplate.label}
                    onChange={event =>
                      updateCustomTemplateField("label", event.target.value)
                    }
                  />
                </label>

                <label>
                  Description
                  <input
                    value={selectedCustomTemplate.description}
                    onChange={event =>
                      updateCustomTemplateField("description", event.target.value)
                    }
                  />
                </label>

                <label>
                  Subject template
                  <input
                    value={selectedCustomTemplate.subjectTemplate}
                    onChange={event =>
                      updateCustomTemplateField("subjectTemplate", event.target.value)
                    }
                  />
                </label>

                <label>
                  Body HTML template
                  <textarea
                    rows={12}
                    value={selectedCustomTemplate.bodyTemplate}
                    onChange={event =>
                      updateCustomTemplateField("bodyTemplate", event.target.value)
                    }
                  />
                </label>

                <label>
                  Field mappings JSON
                  <textarea
                    rows={10}
                    value={JSON.stringify(selectedCustomTemplate.fieldMappings, null, 2)}
                    onChange={event =>
                      updateCustomTemplateField(
                        "fieldMappings",
                        parseJsonField<FieldMapping[]>(event.target.value, selectedCustomTemplate.fieldMappings)
                      )
                    }
                  />
                </label>

                <button
                  className="secondaryButton inlineButton"
                  onClick={() => deleteCustomTemplate(selectedCustomTemplate.id)}
                  type="button"
                >
                  Delete
                </button>
              </>
            )}
          </>
        )}

        <button
          className="secondaryButton inlineButton"
          onClick={addCustomTemplate}
          type="button"
        >
          Add custom template
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
