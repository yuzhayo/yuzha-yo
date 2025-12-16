import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 3002,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});