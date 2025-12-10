/* eslint-env node */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import viteCompression from "vite-plugin-compression";

const resolveFromConfig = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

// Environment auto-detection
const isEmergent = !!process.env.KUBERNETES_SERVICE_HOST || !!process.env.EMERGENT_ENV;
const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG || !!process.env.REPLIT_DB_URL;

// Port priority: PORT env > Platform default (Emergent: 3000, Replit: 5000) > General default: 3000
const DEFAULT_PORT = isReplit ? 5000 : isEmergent ? 3000 : 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  root: resolveFromConfig("."),
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: "automatic",
      babel: {
        plugins: isProd ? [] : [],
        compact: isProd,
      },
    }),
    // Add compression plugin for production builds
    isProd &&
      viteCompression({
        verbose: false,
        disable: false,
        threshold: 10240, // Only compress files > 10KB
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false,
      }),
    // Add Brotli compression for better compression ratio
    isProd &&
      viteCompression({
        verbose: false,
        disable: false,
        threshold: 10240,
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": resolveFromConfig("./src"),
      "@shared": resolveFromConfig("../shared"),
    },
    // Prevent multiple instances of three.js when using HMR or monorepo linking
    dedupe: ["react", "react-dom", "three"],
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
    // Enable HMR optimizations
    hmr: {
      overlay: true,
    },
    // Configure file watching for monorepo
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
    // Enable minification with esbuild (faster than terser)
    minify: "esbuild",
    // CSS minification
    cssMinify: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Rollup options for optimized builds
    rollupOptions: {
      output: {
        // Improved manual chunking strategy
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            // React in separate chunk
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // Three.js in separate chunk (large library)
            if (id.includes("three")) {
              return "three-vendor";
            }
            // Other vendor libraries
            return "vendor";
          }
          // Shared code in separate chunk
          if (id.includes("../shared")) {
            return "shared";
          }
        },
        // Optimize chunk file names
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "three"],
    esbuildOptions: {
      target: "es2020",
      // Enable optimizations
      minify: false, // Don't minify in dev
      treeShaking: true,
      // Optimize loader
      loader: {
        ".js": "jsx",
      },
    },
  },
  // Enable esbuild for faster transpilation
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
    treeShaking: true,
    minifyIdentifiers: isProd,
    minifySyntax: isProd,
    minifyWhitespace: isProd,
    target: "es2020",
  },
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg"],
  // Enable caching
  cacheDir: "node_modules/.vite",
});
