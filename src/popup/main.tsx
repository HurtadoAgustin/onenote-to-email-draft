import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import type { GenerateMailResponse } from "../utils/types";
import "./styles.css";

const sendGenerateMessage = async (): Promise<GenerateMailResponse> =>
  chrome.runtime.sendMessage({ type: "GENERATE_MAIL_FROM_CURRENT_TAB" });

const App = () => {
  const [logs, setLogs] = useState<string[]>(["Listo para generar mail desde OneNote."]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setLogs(["⏳ Leyendo OneNote y preparando draft..."]);

    try {
      const response = await sendGenerateMessage();
      setLogs(response.logs);
    } catch (error) {
      setLogs([`❌ Error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <main className="popup">
      <header className="header">
        <h1>OneNote Draft Bridge</h1>
        <p>Generá un draft desde la página actual.</p>
      </header>

      <section className="actions">
        <button className="primaryButton" disabled={isLoading} onClick={handleGenerate}>
          {isLoading ? "Generando..." : "Generar mail"}
        </button>

        <button className="secondaryButton" disabled={isLoading} onClick={handleOpenOptions}>
          Settings
        </button>
      </section>

      <section className="logs" aria-label="Logs">
        {logs.map((log, index) => (
          <div className="logItem" key={`${log}-${index}`}>
            {log}
          </div>
        ))}
      </section>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
