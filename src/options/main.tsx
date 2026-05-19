import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { defaultConfig, getConfig, resetConfig, saveConfig } from "../utils/config";
import type { ExtensionConfig, FieldMapping } from "../utils/types";
import "./styles.css";

type JsonField = "fieldMappings" | "selectors" | "flags";

const prettyJson = (value: unknown): string => JSON.stringify(value, null, 2);

const parseJsonField = <T,>(value: string, fieldName: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`El campo ${fieldName} no tiene JSON válido.`);
  }
};

const App = () => {
  const [config, setConfig] = useState<ExtensionConfig>(defaultConfig);
  const [fieldMappingsJson, setFieldMappingsJson] = useState(prettyJson(defaultConfig.fieldMappings));
  const [selectorsJson, setSelectorsJson] = useState(prettyJson(defaultConfig.selectors));
  const [flagsJson, setFlagsJson] = useState(prettyJson(defaultConfig.flags));
  const [status, setStatus] = useState("Cargando configuración...");

  useEffect(() => {
    void getConfig().then(savedConfig => {
      setConfig(savedConfig);
      setFieldMappingsJson(prettyJson(savedConfig.fieldMappings));
      setSelectorsJson(prettyJson(savedConfig.selectors));
      setFlagsJson(prettyJson(savedConfig.flags));
      setStatus("Configuración cargada.");
    });
  }, []);

  const updateTextValue = (field: keyof Pick<ExtensionConfig, "mailUrl" | "subjectTemplate" | "bodyTemplate" | "signatureHtml">) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setConfig(current => ({ ...current, [field]: event.target.value }));
  };

  const validateAndBuildConfig = (): ExtensionConfig => ({
    ...config,
    fieldMappings: parseJsonField<FieldMapping[]>(fieldMappingsJson, "fieldMappings"),
    selectors: parseJsonField<ExtensionConfig["selectors"]>(selectorsJson, "selectors"),
    flags: parseJsonField<ExtensionConfig["flags"]>(flagsJson, "flags")
  });

  const handleSave = async () => {
    try {
      const nextConfig = validateAndBuildConfig();
      await saveConfig(nextConfig);
      setConfig(nextConfig);
      setStatus("✅ Configuración guardada.");
    } catch (error) {
      setStatus(`❌ ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleReset = async () => {
    const nextConfig = await resetConfig();
    setConfig(nextConfig);
    setFieldMappingsJson(prettyJson(nextConfig.fieldMappings));
    setSelectorsJson(prettyJson(nextConfig.selectors));
    setFlagsJson(prettyJson(nextConfig.flags));
    setStatus("✅ Configuración restaurada a defaults.");
  };

  const renderJsonField = (
    label: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: JsonField
  ) => (
    <label className="field">
      <span>{label}</span>
      <textarea
        className="codeArea"
        spellCheck={false}
        value={value}
        onChange={event => setter(event.target.value)}
        data-field={field}
      />
    </label>
  );

  return (
    <main className="page">
      <header className="header">
        <h1>OneNote Draft Bridge - Settings</h1>
        <p>Configuración local guardada en chrome.storage.local.</p>
      </header>

      <section className="card">
        <label className="field">
          <span>URL Mail2/Outlook</span>
          <input value={config.mailUrl} onChange={updateTextValue("mailUrl")} />
        </label>

        <label className="field">
          <span>Subject template</span>
          <input value={config.subjectTemplate} onChange={updateTextValue("subjectTemplate")} />
        </label>

        <label className="field">
          <span>Body HTML template</span>
          <textarea value={config.bodyTemplate} onChange={updateTextValue("bodyTemplate")} />
        </label>

        <label className="field">
          <span>Firma HTML</span>
          <textarea value={config.signatureHtml} onChange={updateTextValue("signatureHtml")} />
        </label>
      </section>

      <section className="card">
        {renderJsonField("Field mappings JSON", fieldMappingsJson, setFieldMappingsJson, "fieldMappings")}
        {renderJsonField("Selectors JSON", selectorsJson, setSelectorsJson, "selectors")}
        {renderJsonField("Flags JSON", flagsJson, setFlagsJson, "flags")}
      </section>

      <footer className="footer">
        <button className="primaryButton" onClick={handleSave}>Guardar</button>
        <button className="secondaryButton" onClick={handleReset}>Restaurar defaults</button>
        <span className="status">{status}</span>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
