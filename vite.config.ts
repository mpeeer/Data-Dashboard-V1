import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `base: './'` produces asset paths relative to the document so the build works
// at any prefix (root, /lumen/, /Data-Dashboard-V1/, a custom Pages URL, etc.).
// Override at build time with `vite build --base=/my-path/`.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Lumen — Data Dashboard',
        short_name: 'Lumen',
        description:
          'Drop a CSV, TSV, TXT, or JSON file in and get a clean glassmorphic dashboard.',
        theme_color: '#0b0d1a',
        background_color: '#0b0d1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        // The dashboard reads files from disk in the browser — there's no remote
        // payload to precache. Cache just the app shell so the PWA launches offline.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
});
