import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
const rootEl = document.getElementById("root");
if (!rootEl) {
    throw new Error("Root element #root tidak ditemukan");
}
createRoot(rootEl).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
