/* eslint-env node */
/**
 * Vite Configuration for Warung Meng
 *
 * AI AGENT NOTES:
 * - This config sets up Vite for the Meng restaurant app
 * - Port 3001 is used to avoid conflict with yuzha hub (port 3000)
 * - React plugin with automatic JSX runtime
 * - Alias @ points to src directory for clean imports
 * - Production builds are optimized with compression
 *
 * Key Environment Detection:
 * - Kubernetes/Emergent: Uses port 3001 by default
 * - Can override with PORT env variable
 *
 * When modifying:
 * - Keep port different from yuzha (3000)
 * - Maintain alias configuration for imports
 * - Don't remove React plugin or HMR config
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const resolveFromConfig = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

// Environment auto-detection
const isEmergent = !!process.env.KUBERNETES_SERVICE_HOST || !!process.env.EMERGENT_ENV;
const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG || !!process.env.REPLIT_DB_URL;

// Port priority: PORT env > Platform default (Emergent: 3001) > General default: 3001
const DEFAULT_PORT = isReplit ? 3001 : isEmergent ? 3001 : 3001;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  root: resolveFromConfig("."),
  plugins: [
    react({
      jsxRuntime: "automatic",
      babel: {
        plugins: isProd ? [] : [],
        compact: isProd,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolveFromConfig("./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  publicDir: "public",
  server: {
    host: "0.0.0.0",
    port: PORT,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: PORT,
  },
  build: {
    target: "es2020",
    sourcemap: isProd ? false : "inline",
    minify: "esbuild",
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            return "vendor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    esbuildOptions: {
      target: "es2020",
      minify: false,
      treeShaking: true,
      loader: {
        ".js": "jsx",
      },
    },
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
    treeShaking: true,
    minifyIdentifiers: isProd,
    minifySyntax: isProd,
    minifyWhitespace: isProd,
    target: "es2020",
  },
  cacheDir: "node_modules/.vite",
});
