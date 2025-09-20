import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const r = (p: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), p);
const monorepoRoot = r('..');

export default defineConfig({
  root: r('.'),
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(monorepoRoot, 'shared'),
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber']
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react': ['react', 'react-dom']
        }
      }
    }
  },
});
