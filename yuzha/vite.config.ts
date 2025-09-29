/* eslint-env node */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const resolveFromConfig = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

// Auto-port detection: PORT env > Replit default 5000 > general default 3000
const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG || !!process.env.REPLIT_DB_URL;

const DEFAULT_PORT = isReplit ? 5000 : 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

export default defineConfig({
  root: resolveFromConfig("."),
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolveFromConfig("./src"),
      "@shared": resolveFromConfig("../shared"),
    },
  },
  define: {
    __SHARED_ASSETS_PATH__: JSON.stringify(resolveFromConfig("../shared/asset")),
  },
  publicDir: false,
  server: {
    host: "0.0.0.0",
    port: PORT,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [resolveFromConfig("."), resolveFromConfig("../shared")],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: PORT,
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
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg"],
});
