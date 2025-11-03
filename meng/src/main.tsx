/**
 * Application Entry Point
 *
 * AI AGENT NOTES:
 * - Main entry file that renders the React app
 * - Sets up React root with StrictMode
 * - Imports global styles
 *
 * Key Files Imported:
 * - App.tsx: Main application component
 * - index.css: Global styles including Tailwind
 *
 * StrictMode Benefits:
 * - Identifies potential problems in components
 * - Activates additional checks and warnings (dev only)
 * - Does not affect production builds
 *
 * When modifying:
 * - Keep StrictMode enabled for development
 * - Don't remove root element check
 * - Maintain import order (CSS before App)
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Get root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Check your index.html file.");
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
