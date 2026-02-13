import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Viewer from "@samvera/clover-iiif/viewer";
import { initCloverI18n } from "@samvera/clover-iiif/i18n";
import { createIllustrationDetectorPlugin } from "../src";

const MANIFEST_URL =
  "https://api.dc.library.northwestern.edu/api/v2/works/79dc48e5-1833-43b2-9c6a-d04b5af746be?as=iiif";

function App() {
  const i18n = useMemo(() => initCloverI18n(), []);
  const [language, setLanguage] = useState("en");
  const [iiifContent, setIiifContent] = useState(MANIFEST_URL);
  const [manifestInput, setManifestInput] = useState(MANIFEST_URL);
  const [plugins] = useState([
    createIllustrationDetectorPlugin({
      tabLabelByLanguage: {
        en: "Illustrations",
        es: "Ilustraciones",
        fr: "Illustrations (FR)",
      },
      translations: {
        es: {
          classifyManifest: "Clasificar manifiesto",
          classifying: "Clasificando...",
          statusClassifying: "clasificando",
          statusClassified: "clasificado",
          statusPending: "pendiente",
          statusError: "error",
          statusSkipped: "omitido",
          confidenceThresholdLabel:
            "Mostrar lienzos clasificados por encima del umbral de confianza %: {{value}}",
          noThumbnail: "Sin miniatura",
          navigateToCanvasAriaLabel: "Ir al lienzo {{label}}",
          status: "Estado",
          label: "Etiqueta",
          illustratedConfidence: "Confianza de ilustración",
        },
        fr: {
          classifyManifest: "Classifier le manifeste",
          classifying: "Classification...",
          statusClassifying: "classification",
          statusClassified: "classifié",
          statusPending: "en attente",
          statusError: "erreur",
          statusSkipped: "ignoré",
          confidenceThresholdLabel:
            "Afficher les canevas classés au-dessus du seuil de confiance %: {{value}}",
          noThumbnail: "Pas de vignette",
          navigateToCanvasAriaLabel: "Aller au canevas {{label}}",
          status: "Statut",
          label: "Libellé",
          illustratedConfidence: "Confiance illustration",
        },
      },
    }),
  ]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = manifestInput.trim();
    if (!trimmed) {
      return;
    }
    setIiifContent(trimmed);
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ marginTop: 0 }}>Clover Illustration Detector Plugin</h1>
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="language" style={{ display: "block", marginBottom: "0.375rem" }}>
          Demo language
        </label>
        <select
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          style={{ padding: "0.35rem 0.5rem" }}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
      <form onSubmit={onSubmit} style={{ marginBottom: "1rem" }}>
        <label htmlFor="manifest-url" style={{ display: "block", marginBottom: "0.375rem" }}>
          Manifest URL
        </label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            id="manifest-url"
            type="url"
            value={manifestInput}
            onChange={(event) => setManifestInput(event.target.value)}
            placeholder="https://example.org/manifest.json"
            style={{ flex: 1, minWidth: 0, padding: "0.5rem" }}
          />
          <button type="submit">Load Manifest</button>
        </div>
      </form>
      <Viewer
        key={iiifContent}
        iiifContent={iiifContent}
        plugins={plugins}
        options={{
          informationPanel: {
            open: true,
          },
          showTitle: true,
        }}
      />
    </div>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root container");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
