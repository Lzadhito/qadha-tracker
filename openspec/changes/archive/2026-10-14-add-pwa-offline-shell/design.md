# Design

## Context

- React Router 7 in SPA mode (`ssr: false`), built to static files in `build/client`, hosted on Netlify with a `/* -> /index.html` rewrite. See proposal.md for motivation.
- `public/manifest.webmanifest` exists and is linked in `app/root.tsx`, but has no icons. `public/` only has `favicon.ico` and `sujud.svg`.
- Writes are already offline-safe: `app/lib/outbox.ts` queues ops in localStorage and `app/lib/sync.ts` drains them. Only the app shell itself needs the network today.
- Vite content-hashes everything under `/assets`, and Netlify already caches those as immutable.

## Goals / Non-Goals

**Goals:**
- App shell launches offline after one online visit.
- A deploy never leaves users on a shell that points at deleted chunks.
- No change to how data is fetched or synced.

**Non-Goals:**
- Offline reads of server data (persisting React Query).
- Push notifications, Background Sync API, periodic sync.
- A custom install button or install-prompt UI (browser default is enough).

## Decisions

**1. `vite-plugin-pwa` in `generateSW` mode, not a hand-written worker.**
The plugin hooks into the Vite build, so the precache manifest (every hashed file plus its revision) is generated from the real output on each build. A hand-written worker would need that list maintained by hand, and a wrong list is the classic way to ship a stale or broken shell. Cost: one dev dependency. `generateSW` over `injectManifest` because we need no custom worker logic.

**1a. Generate the worker from React Router's `buildEnd`, not only from the plugin's own build step.**
Found during implementation: React Router writes `index.html` (SPA mode) and the route-manifest chunk (`assets/manifest-<hash>.js`) after Vite's client build, so the plugin's own snapshot of the output folder misses both. Without the manifest chunk the offline shell loads but the app cannot boot. `react-router.config.ts` therefore calls the plugin's `api.generateSW()` from `buildEnd`, which runs after everything is on disk. This also lets `index.html` be hashed like any other file. Alternative considered: dropping the plugin for `workbox-build` plus `workbox-window`; rejected because it rewrites working code for the same result.

**2. Precache the shell; no runtime caching of API calls.**
Workbox precaches `html, js, css, woff2, svg, png, ico`. Supabase requests get no route, so they go straight to the network. This keeps the outbox the single owner of offline write behaviour and avoids serving stale ledger numbers that look correct.

**3. Navigation fallback to `index.html`.**
In SPA mode every route is the same HTML file, so any navigation request offline is answered with the precached `index.html` and the client router takes over. Deny-list the service worker file itself and any non-app paths so they do not get the HTML fallback.

**4. Update flow: `registerType: 'prompt'` with a toast.**
The new worker installs in the background and waits. The app shows a sonner toast ("Update available, Reload"); on click it activates the new worker and reloads. Alternative `autoUpdate` swaps silently, but can reload the page in the middle of a user's action, which is worse for a logging app. The app already uses `sonner`, so no new UI dependency.

**5. Icons are static PNGs checked into `public/`, derived from `sujud.svg`.**
Generated once (192, 512, maskable 512 with safe-zone padding, 180 apple-touch) rather than at build time. Icons change rarely, and a build-time generator is another dependency to maintain.

**6. Service worker registration happens client-side only, in `root.tsx`.**
Using the plugin's virtual register module from an effect. The plugin's dev option stays off, so `npm run dev` is not affected by a worker caching files while developing.

**7. Netlify: `Cache-Control: no-cache` on `/sw.js` and the manifest.**
Browsers already bypass HTTP cache for the worker script by default in modern versions, but older ones and CDNs do not, so the header is explicit insurance. The `/*` rewrite does not override real files, so `/sw.js` is still served as itself.

## Risks / Trade-offs

- **Stale shell pins users to an old build** → prompt-based update flow plus a no-cache header on the worker; verify by deploying two builds in testing.
- **Misconfigured fallback swallows API or asset 404s with HTML** → navigation fallback applies to navigations only; test that a missing asset is a real 404.
- **iOS Safari evicts caches after long inactivity** → accepted; the app falls back to online loading, and the outbox data lives in localStorage, which has the same eviction caveat already.
- **Dev/prod divergence** → worker is disabled in dev, so offline behaviour is only verified against `build` + `start` or `vite preview`.
- **Plugin compatibility with React Router's Vite plugin** → the spike showed it works only with the `buildEnd` step in decision 1a; offline boot is covered by a browser test, because a precache list can look right and still miss a file the app needs.
- **Relies on the plugin's `api` property**, which is documented for framework integrations but is not a React Router contract → a build that stops emitting `index.html` or the manifest chunk in `sw.js` fails the offline browser check; re-run it when upgrading either package.
