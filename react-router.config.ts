import type { Config } from "@react-router/dev/config"

export default {
  // SPA mode: all logic client-side, static hosting
  ssr: false,
  // React Router writes index.html and the route-manifest chunk after Vite's client build, so the
  // worker's precache list has to be generated here, once the output folder is complete.
  async buildEnd({ viteConfig }) {
    const pwa = viteConfig.plugins.find((p) => p.name === "vite-plugin-pwa")
    await (pwa as { api?: { generateSW(): Promise<void> } } | undefined)?.api?.generateSW()
  },
} satisfies Config
