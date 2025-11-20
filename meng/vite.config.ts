import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const resolveFromConfig = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath)

const DEFAULT_PORT = 3001
const PORT = Number(process.env.PORT) || DEFAULT_PORT

export default defineConfig({
  root: resolveFromConfig('.'),
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      '@': resolveFromConfig('./src'),
      '@shared': resolveFromConfig('../shared'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: PORT,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [resolveFromConfig('.'), resolveFromConfig('../shared')],
    },
    hmr: {
      overlay: true,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: PORT,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
