import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Bumped on every build so the index.html bootstrap script (see Service
// Worker management block) triggers its nuclear cache reset once per
// deploy. Replaces a previously hand-bumped constant that drifted stale.
const BUILD_VERSION = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-build-version',
      transformIndexHtml(html) {
        return html.replace(/__BUILD_VERSION__/g, BUILD_VERSION);
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Workout Tracker',
        short_name: 'Workout Tracker',
        description: 'Track your workouts and build strength',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/tv/],
        // Exclude HTML from the precache so the SW always goes to
        // network for index.html. Was: '**/*.{js,css,html,...}'.
        // With HTML precached, Safari held onto stale index.html for
        // hours after a deploy — even with Cache-Control headers.
        globPatterns: ['**/*.{js,css,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // Always try network first for HTML navigations, fall
            // back to the offline page only on real failure.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /\/tracker\.js$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tracker-js-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'tracker.js',
        assetFileNames: 'tracker.[ext]',
      }
    },
    cssCodeSplit: false,
  }
})
