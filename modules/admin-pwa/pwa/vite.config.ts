/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { brand } from './src/brand.ts'

/** Fills the %BRAND_*% placeholders in index.html from src/brand.ts. */
function brandHtml(): Plugin {
  const values: Record<string, string> = {
    '%BRAND_NAME%': brand.name,
    '%BRAND_SHORT_NAME%': brand.shortName,
    '%BRAND_THEME_COLOR%': brand.themeColor,
    '%BRAND_LANG%': brand.lang,
  }
  return {
    name: 'brand-html',
    transformIndexHtml: (html) => html.replace(/%BRAND_[A-Z_]+%/g, (m) => values[m] ?? m),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    brandHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      // injectManifest: we own src/sw.ts (FCM background handling).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: brand.name,
        short_name: brand.shortName,
        description: brand.description,
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: brand.themeColor,
        background_color: brand.backgroundColor,
        lang: brand.lang,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    // Placeholder web config so src/firebase.ts can initialise without a local .env.
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-project.web.app',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:test',
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})
