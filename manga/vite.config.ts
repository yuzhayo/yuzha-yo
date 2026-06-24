import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 3003,
    host: true,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [path.resolve(__dirname, "."), path.resolve(__dirname, "../shared")],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3003,
  },
  build: {
    outDir: "dist",
    target: "es2020",
    sourcemap: false,
  },
});
