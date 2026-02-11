import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import "./i18n"; // Initialize i18n before rendering
import App from "./App.tsx";
import "./index.css";

// Initialize error monitoring (no-op when VITE_SENTRY_DSN is not set)
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
