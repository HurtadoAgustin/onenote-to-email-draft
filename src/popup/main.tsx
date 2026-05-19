import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import type { GenerateDraftResponse } from "../utils/types";
import "./styles.css";

const App = () => {
  const [logs, setLogs] = useState<string[]>([
    "Abrí una página de OneNote Web y presioná Generar mail."
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const generateMail = async () => {
    setIsLoading(true);
    setLogs(["Generando draft..."]);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "GENERATE_GMAIL_DRAFT"
      })) as GenerateDraftResponse;

      setLogs(response?.logs?.length ? response.logs : ["❌ No hubo respuesta de la extensión"]);
    } catch (error) {
      setLogs([
        "❌ Error al comunicarse con la extensión",
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
        <p>Genera un draft de Gmail desde OneNote.</p>
      </header>

      <section className="actions">
        <button className="primaryButton" disabled={isLoading} onClick={generateMail}>
          {isLoading ? "Generando..." : "Generar mail"}
        </button>
        <button className="secondaryButton" disabled={isLoading} onClick={openOptions}>
          Settings
        </button>
      </section>

      <section className="logs">
        {logs.map((log, index) => (
          <div className="logItem" key={`${log}-${index}`}>
            {log}
          </div>
        ))}
      </section>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
