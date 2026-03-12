/* eslint-disable no-undef */
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from 'tailwindcss';

export default ({ mode }: { mode: string }) => {
  // Load env file based on `mode` (development, production, etc.).
  // Use empty string as the third arg to load ALL variables, not only those starting with VITE_
  const env = loadEnv(mode, process.cwd(), '');

  // Prefer VITE_PORT, then PORT, fallback to 5173
  const port = Number(env.VITE_PORT || env.PORT || 5173);

  return defineConfig({
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss()]
      }
    },
    base: '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      chunkSizeWarningLimit: 3000
    },
    server: {
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.git/**, **/.next/**',
          '**/.vercel/**',
          '**/services/**'
        ]
      },
      port
    }
  });
};
