import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { defaultConfig, getConfig, resetConfig, saveConfig } from "../utils/config";
import type { ExtensionConfig, ExtensionFlags, ExtensionSelectors, FieldMapping } from "../utils/types";
import "./styles.css";

const parseJsonField = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const App = () => {
  const [config, setConfig] = useState<ExtensionConfig>(defaultConfig);
  const [fieldMappingsJson, setFieldMappingsJson] = useState("");
  const [selectorsJson, setSelectorsJson] = useState("");
  const [flagsJson, setFlagsJson] = useState("");
  const [status, setStatus] = useState("Cargando configuración...");

  useEffect(() => {
    void getConfig().then(loadedConfig => {
      setConfig(loadedConfig);
      setFieldMappingsJson(JSON.stringify(loadedConfig.fieldMappings, null, 2));
      setSelectorsJson(JSON.stringify(loadedConfig.selectors, null, 2));
      setFlagsJson(JSON.stringify(loadedConfig.flags, null, 2));
      setStatus("Configuración cargada");
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

  const save = async () => {
    const updatedConfig: ExtensionConfig = {
      ...config,
      fieldMappings: parseJsonField<FieldMapping[]>(fieldMappingsJson, config.fieldMappings),
      selectors: parseJsonField<ExtensionSelectors>(selectorsJson, config.selectors),
      flags: parseJsonField<ExtensionFlags>(flagsJson, config.flags)
    };

    await saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setStatus("✅ Configuración guardada");
  };

  const reset = async () => {
    const restoredConfig = await resetConfig();
    setConfig(restoredConfig);
    setFieldMappingsJson(JSON.stringify(restoredConfig.fieldMappings, null, 2));
    setSelectorsJson(JSON.stringify(restoredConfig.selectors, null, 2));
    setFlagsJson(JSON.stringify(restoredConfig.flags, null, 2));
    setStatus("✅ Configuración restaurada");
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Settings</h1>
        <p>Configuración local de OneNote to Mail Draft.</p>
      </header>

      <section className="card">
        <label>
          URL Gmail
          <input
            value={config.mailUrl}
            onChange={event => updateConfigField("mailUrl", event.target.value)}
          />
        </label>

        <label>
          Subject template
          <input
            value={config.subjectTemplate}
            onChange={event => updateConfigField("subjectTemplate", event.target.value)}
          />
        </label>

        <label>
          Body HTML template
          <textarea
            rows={10}
            value={config.bodyTemplate}
            onChange={event => updateConfigField("bodyTemplate", event.target.value)}
          />
        </label>

        <label>
          Firma HTML
          <textarea
            rows={4}
            value={config.signatureHtml}
            onChange={event => updateConfigField("signatureHtml", event.target.value)}
          />
        </label>

        <label>
          En caso de vacío completar con
          <input
            placeholder="Ej: No aplica"
            value={config.emptyFieldFallback}
            onChange={event => updateConfigField("emptyFieldFallback", event.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <label>
          Field mappings JSON
          <textarea
            rows={10}
            value={fieldMappingsJson}
            onChange={event => setFieldMappingsJson(event.target.value)}
          />
        </label>

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
        <button className="primaryButton" onClick={save}>Guardar</button>
        <button className="secondaryButton" onClick={reset}>Restaurar defaults</button>
        <span>{status}</span>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
