import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// `base: './'` produces asset paths relative to the document so the build works
// at any prefix (root, /lumen/, a custom Pages URL, etc.).
// Override at build time with `vite build --base=/my-path/`.
export default defineConfig({
  base: './',
  resolve: {
    // Mirrors the `paths` block in tsconfig.app.json so `@/foo`
    // resolves at build / dev time as well as in the typechecker.
    // Uses `import.meta.url` because tsconfig says `"type": "module"`
    // and `__dirname` is not available in ESM.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Lumen — Minimal Data Dashboard',
        short_name: 'Lumen',
        description:
          'Drop a CSV, TSV, TXT, or JSON file and explore your data with charts, search, and themes.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
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
