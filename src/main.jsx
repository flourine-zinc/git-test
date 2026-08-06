import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ensureStorageVersion } from "./utils/storage.js";
import "./styles/styles.css";

// TEMPORARY auth diagnostics — remove after production debugging is done.
console.debug("[boot] URL:", window.location.href);
console.debug("[boot] SW controlled:", !!navigator.serviceWorker?.controller);

// Ensure the storage schema version is current before the app loads
// (runs any migrations needed for older saves). Best-effort: the app
// still boots when localStorage is unavailable.
ensureStorageVersion();

// Register the service worker for offline + installable support.
// Only in production: the dev server serves un-hashed assets that
// would be incorrectly cached.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        // Self-heal stale app shells: a cache version bump (see public/sw.js)
        // makes the new service worker take control immediately. If this page
        // was already controlled by an older service worker, reload so the
        // fresh deployed bundle (with the fixed auth flow) is served instead
        // of the stale cached shell.
        if (navigator.serviceWorker.controller) {
          let refreshing = false;
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });
        }
      })
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
