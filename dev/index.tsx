import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import Viewer from "@samvera/clover-iiif/viewer";
import { createIllustrationDetectorPlugin } from "../src";

const MANIFEST_URL =
  "https://api.dc.library.northwestern.edu/api/v2/works/79dc48e5-1833-43b2-9c6a-d04b5af746be?as=iiif";

function App() {
  const [iiifContent, setIiifContent] = useState(MANIFEST_URL);
  const [manifestInput, setManifestInput] = useState(MANIFEST_URL);
  const [plugins] = useState([createIllustrationDetectorPlugin()]);

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
