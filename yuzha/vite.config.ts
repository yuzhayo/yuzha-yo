import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const resolveFromConfig = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

export default defineConfig({
  root: resolveFromConfig("."),
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolveFromConfig("./src"),
      "@shared": resolveFromConfig("../shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [resolveFromConfig("."), resolveFromConfig("../shared")],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
  },
  build: {
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
