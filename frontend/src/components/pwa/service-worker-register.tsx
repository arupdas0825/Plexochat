"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // New content is available; can show refresh prompt
                    console.log("PlexoChat update available; refresh to activate.");
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn("ServiceWorker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
