# Tasks

## 1. Spike: plugin works with React Router SPA build

- [x] 1.1 Add `vite-plugin-pwa` as a dev dependency and register it in `vite.config.ts` (`generateSW`, `registerType: 'prompt'`, dev disabled); verify `npm run build` succeeds and `build/client` contains `sw.js` and `index.html`
- [x] 1.2 Confirm the generated precache list includes `index.html`, the hashed `/assets/*` files and `assets/manifest-<hash>.js` by inspecting `build/client/sw.js`
- [x] 1.3 Generate the worker from `buildEnd` in `react-router.config.ts` (files React Router writes after Vite's build are otherwise missed); verify `sw.js` lists `index.html` and the route-manifest chunk

## 2. Installable manifest and icons

- [x] 2.1 Export 192, 512, maskable 512 (padded safe zone) and 180 apple-touch PNGs from `public/sujud.svg` into `public/`; verify each file exists with the right pixel size (`file public/*.png`)
- [x] 2.2 Move the manifest into the plugin config (or extend `public/manifest.webmanifest`) with `id`, `scope`, and the icon entries; verify DevTools > Application > Manifest shows no errors and lists all icons
- [x] 2.3 Add the `apple-touch-icon` link in `app/root.tsx`; verify it appears in the built `index.html`
- [x] 2.4 Verify installability: serve the build over localhost, confirm Chrome shows the install action and a Lighthouse PWA/installable check passes

## 3. Offline shell behaviour

- [x] 3.1 Set the navigation fallback to `index.html`, deny-listing `/sw.js` and manifest; verify with DevTools "Offline" that reloading `/` and a deep route both render the app
- [x] 3.2 Confirm Supabase requests are not routed through the worker (no runtime caching rules); verify in the Network tab that API calls show no "from service worker" and fail normally offline
- [x] 3.3 Verify offline logging end to end: go offline, log a prayer, go online, and confirm the outbox drains and the row reaches Supabase

## 4. Update flow

- [x] 4.1 Register the worker client-side in `app/root.tsx` and show a sonner toast with a Reload action when a new version is waiting; verify by building twice, serving the first, rebuilding, and seeing the toast appear
- [x] 4.2 Verify that clicking Reload activates the new worker and the page loads the new build with no missing-chunk errors in the console

## 5. Hosting and integration

- [x] 5.1 Add `Cache-Control: no-cache` headers for `/sw.js` and `/manifest.webmanifest` in `netlify.toml`; verify `netlify.toml` parses and declares `no-cache` for both paths (a live `curl -I` is only possible after a deploy)
- [x] 5.2 Run `npm run typecheck` and `npm test`; verify both pass with the new registration code
- [x] 5.3 Document in `README.md` how to test the PWA locally (build, preview, DevTools offline) and verify the documented commands work as written
- [ ] 5.4 Final check on a real phone: install from the deploy preview, enable airplane mode, open the app, and log a prayer

## Workflow follow-up

- Browser checks (2.2, 2.4, 3.1-3.3, 4.1-4.2) were run automatically in headless Chromium (Playwright) with a fake Supabase server, not by hand; the scripts are not part of the repo.
- After the first real deploy, run `curl -I <site>/sw.js` and confirm `Cache-Control: no-cache`.

- Archive the change once the deploy preview checks pass.
