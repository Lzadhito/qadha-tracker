# Proposal

## Why

Qadha Tracker already logs prayers local-first (an outbox in localStorage drains to Supabase when reachable), but the app itself cannot start without a network: the HTML and JS bundles always come from the server. It also isn't installable, because the manifest has no PNG icons. Making it a real PWA lets users add it to their home screen and open it, and log a prayer, with no signal.

## What Changes

- Add PNG app icons (192, 512, maskable 512) and an `apple-touch-icon`, and reference them from the manifest and `root.tsx`.
- Complete the manifest so browsers treat it as installable (`id`, `scope`, icons).
- Add a service worker that precaches the built app shell (HTML, hashed JS/CSS, fonts, icons) so the app launches offline.
- Serve the app shell as the navigation fallback for offline route loads (SPA mode, single `index.html`).
- Never cache or intercept Supabase/API traffic; the existing outbox keeps owning offline writes.
- Add an update flow: when a new deploy is available, tell the user and let them reload, rather than silently serving a stale shell.
- Netlify headers so the service worker file itself is never cached long-term.

Out of scope: caching server data for offline reads (React Query persistence), push notifications, background sync API.

## Capabilities

### New Capabilities
- `pwa-install`: the app can be installed to a device home screen as a standalone app with proper name, icons, and theme.
- `offline-app-shell`: the app launches and navigates offline from a cached shell, stays current across deploys, and leaves API traffic untouched.

### Modified Capabilities

(none; `openspec/specs/` is empty, so there is nothing existing to modify)

## Impact

- **New dev dependency:** `vite-plugin-pwa` (Workbox) in `vite.config.ts`.
- **Code:** `vite.config.ts`, `app/root.tsx` (icon links, SW registration, update prompt), `public/` (icons, manifest).
- **Config:** `netlify.toml` (no-cache header for the service worker).
- **Assumption:** the scope is "installable + opens offline" (option B from exploration); cached read data is deferred.
- **Risk surface:** a stale or broken service worker can pin users to an old build, so the update flow and header are part of the change, not extras.
