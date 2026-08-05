import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ensureStorageVersion } from "./utils/storage.js";
import "./styles/styles.css";

// Ensure the storage schema version is current before the app loads
// (runs any migrations needed for older saves). Best-effort: the app
// still boots when localStorage is unavailable.
ensureStorageVersion();

// Register the service worker for offline + installable support.
// Only in production: the dev server serves un-hashed assets that
// would be incorrectly cached.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
