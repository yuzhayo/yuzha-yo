import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration for Plantation Cafe Resto
 * 
 * Purpose: Configure Vite build tool for optimal React + TypeScript development
 * Features:
 * - Fast HMR (Hot Module Replacement)
 * - Optimized production builds
 * - React Fast Refresh for instant updates
 * 
 * For future AI agents:
 * - This config uses standard React plugin
 * - Server runs on port 3001 by default (configurable)
 * - Build output goes to 'dist' folder
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
