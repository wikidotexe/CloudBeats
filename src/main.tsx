import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize PWA and background audio features
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service Worker registration failed:", error);
    });
  });
}

// Handle iOS-specific setup for audio
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
if (isIOS) {
  // Ensure audio context is created after user interaction
  document.addEventListener(
    "touchend",
    () => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !(window as any)._audioInitialized) {
        try {
          new AudioContextClass();
          (window as any)._audioInitialized = true;
        } catch (e) {
          console.warn("Audio context initialization skipped");
        }
      }
    },
    { once: true },
  );
}

createRoot(document.getElementById("root")!).render(<App />);
