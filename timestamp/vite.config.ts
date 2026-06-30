/* eslint-env node */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const resolveFromConfig = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolveFromConfig("./src"),
      "@shared": resolveFromConfig("../shared"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: {
      allow: [resolveFromConfig("."), resolveFromConfig("../shared")],
    },
  },
});
