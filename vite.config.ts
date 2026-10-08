import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      // "prompt": a new worker waits until the user taps Reload, so a deploy never
      // swaps the app out from under someone mid-log.
      registerType: "prompt",
      // root.tsx registers the worker and links the manifest itself (React Router owns the HTML).
      injectRegister: false,
      manifest: {
        id: "/",
        name: "Qadha Tracker",
        short_name: "Qadha",
        description: "Track your missed prayers and fasts",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#2d5a3d",
        background_color: "#ffffff",
        lang: "id",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2,svg,png,ico}"],
        // Real files must not be answered with the SPA shell when navigated to directly.
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/workbox-[^/]+\.js$/, /^\/manifest\.webmanifest$/],
      },
    }),
  ],
})
