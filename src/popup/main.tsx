import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { emailTemplates } from "../templateRegistry";
import type { EmailTemplateId } from "../utils/types";
import type { GenerateDraftResponse } from "../utils/types";
import "./styles.css";

const App = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);

  const generateMail = async (templateId: EmailTemplateId) => {
    const template = emailTemplates.find(item => item.id === templateId);

    setIsLoading(true);
    setShowTemplateOptions(false);
    setLogs([`Generating draft: ${template?.label ?? templateId}...`]);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "GENERATE_GMAIL_DRAFT",
        templateId
      })) as GenerateDraftResponse;

      setLogs(response?.logs?.length ? response.logs : ["❌ No response from the extension"]);
    } catch (error) {
      setLogs([
        "❌ Error while communicating with the extension",
        error instanceof Error ? error.message : String(error)
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <main className="container">
      <header className="header">
        <h1>OneNote to Mail Draft</h1>
        <p>Generate a Gmail draft from OneNote.</p>
      </header>

      <section className="actions">
        <button
          className="primaryButton"
          disabled={isLoading}
          onClick={() => {
            setLogs([]);
            setShowTemplateOptions(currentValue => !currentValue);
          }}
        >
          {isLoading ? "Generating..." : "Send email"}
        </button>
        <button
          aria-label="Open settings"
          className="settingsButton"
          disabled={isLoading}
          onClick={openOptions}
          title="Settings"
        >
          ⚙
        </button>
      </section>

      {showTemplateOptions && (
        <section className="templateOptions">
          <h2>Which email topic do you want to send?</h2>
          <div className="templateGrid">
            {emailTemplates.map(template => (
              <button
                className="templateButton"
                disabled={isLoading}
                key={template.id}
                onClick={() => void generateMail(template.id)}
              >
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {logs.length > 0 && (
        <section className="logs">
          {logs.map((log, index) => (
            <div className="logItem" key={`${log}-${index}`}>
              {log}
            </div>
          ))}
        </section>
      )}
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
