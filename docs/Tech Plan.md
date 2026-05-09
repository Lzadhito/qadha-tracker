Qadha Tracker — Tech Plan (PRD → Implementation Sequence)

 Context

 PRD at docs/PRD.md defines a privacy-first, mobile-first PWA for Muslims tracking qadha (missed prayers + fasts).
 Repo already scaffolded: React Router v7 (currently SSR), Tailwind v4, shadcn (Button installed), TanStack Query,
 react-hook-form, zod, react-i18next, base-ui, lucide-react. No Supabase, no Drizzle, no PWA tooling yet.

 Decisions locked with user:

- Rendering: SPA (ssr: false in react-router.config.ts) — simpler hosting, all logic client-side
- Host: Netlify (static SPA deploy)
- Brand: Qadha Tracker (short_name Qadha)
- i18n: id + en both at P0
- ORM: Drizzle for schema + migrations (drizzle-kit). Runtime reads/writes via supabase-js (RLS enforces auth).
 Drizzle never runs in browser.

 SPA-specific consequences vs PRD assumptions:

- Route protection: loaders still work in SPA mode (run client-side). Use clientLoader instead of loader.
- Baseline regeneration "Edge Function or RPC for atomicity" (PRD §11) → must be Supabase RPC / Edge Function (not
 in client). Plan keeps it server-side.
- Service worker / offline ledger queue is client-only — fits SPA.

 ---
 Pre-Execution Checklist (do BEFORE Step 0)

 Split: external/manual setup (you do, mostly outside repo) vs scaffold (Claude does in Step 0–2). Code scaffolding
 = part of plan, not prereq.

 A. External accounts + secrets (you, manual)

 1. Supabase
    - Create project at supabase.com → region close to users (Singapore for ID audience).
    - Copy from Project Settings → API: `Project URL`, `anon public key`, `service_role key` (keep secret).
    - Copy from Project Settings → Database: `Connection string` (URI mode) for drizzle-kit.
    - Confirm encryption at rest (default on managed Supabase).
 2. Google OAuth (for /auth/sign-in Google button)
    - Google Cloud Console → new project → OAuth consent screen → External, fill app name "Qadha Tracker", logo,
      privacy policy URL placeholder.
    - Create OAuth Client ID (Web application). Authorized redirect URI:
      `https://<project-ref>.supabase.co/auth/v1/callback`.
    - Copy Client ID + Client Secret.
    - NOTE: Client ID + Secret DO NOT go in .env or repo. Pass them to Supabase dashboard (next step).
      Supabase handles OAuth server-side; client never sees secret.
 3. Supabase Auth config (dashboard)
    - Authentication → Providers → enable Email (magic link only, disable password). Customize email template later.
    - Authentication → Providers → enable Google, paste OAuth client ID + secret.
    - Authentication → URL Configuration → Site URL = `http://localhost:5173` for dev. Add additional redirect URLs:
      `http://localhost:5173/auth/callback`, prod domain `/auth/callback` (add after Netlify deploy).
 4. Netlify
    - Account at netlify.com → connect GitHub repo (after first push). Defer until Step 14.
    - After deploy created: go to Site settings → Build & deploy → Environment → add:
      - `VITE_SUPABASE_URL` = your Supabase project URL
      - `VITE_SUPABASE_ANON_KEY` = your anon public key
      - Do NOT add DATABASE_URL (dev/migration-only, never needed in deployed function).
 5. Domain (optional, defer until ship)

 B. Local tooling (you, one-time install)

 1. Supabase CLI: `npm i supabase --save-dev` then `supabase login`.
 2. Confirm Node ≥ 20.
 3. `supabase init` in repo root (creates `supabase/` folder if not present).
 4. `supabase link --project-ref <ref>` to bind local CLI to the project.

 C. Assets (you, manual)

 1. App icons: 192×192, 512×512, 512×512-maskable PNG. Placeholder OK at P0 (single-color crescent on theme bg).
    Drop into `public/icons/`.
 2. Theme color decision: pick one — forest green `#2d5a3d` or muted teal `#3d6b6b`. Used in manifest + Tailwind
    primary. Lock before Step 4.
 3. Favicon (replace current `public/favicon.ico`).

 C2. shadcn components (you, manual — run before Claude starts)

 ```
 npx shadcn@latest add card sheet dialog alert-dialog input label radio-group slider tabs skeleton sonner calendar popover select switch form separator dropdown-menu
 ```

 (`button` already installed.) 19 components total. Per-component mapping documented in Step 4.

 D. Local secrets file (you, after A)

 Create `.env.local` (gitignored):

 ```
 VITE_SUPABASE_URL=https://<ref>.supabase.co
 VITE_SUPABASE_ANON_KEY=<anon-key>
 DATABASE_URL=postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres
 ```

 E. Fiqh sanity check (PRD §18)

 Defer scholar consult until P0 ships to self. Mark TBDs with `// FIQH-TBD:` per PRD.

 F. What Claude scaffolds (NOT prereq — runs in Step 0–2)

- `npm install` of all new deps (Supabase client, Drizzle, vite-plugin-pwa, i18next, etc.)
- TanStack Query setup (already in deps — Claude wires `QueryClientProvider` in `app/root.tsx`)
- Drizzle schema + config files
- Supabase client singleton
- i18next init

 Ready-to-execute gate: A.1, A.2, A.3, B, C2, D done. Then Claude runs Step 0.

 ---
 Step 0 — Lock Foundations

 Files:

- package.json — set "name": "qadha-tracker"
- react-router.config.ts — ssr: false
- .env.example — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, DATABASE_URL (drizzle-kit only, gitignored locally)
- .gitignore — confirm .env* ignored
- README.md — replace boilerplate with project name + setup steps

 Add deps:
 @supabase/supabase-js
 drizzle-orm drizzle-kit postgres
 @tanstack/react-router-devtools (optional)
 date-fns
 i18next i18next-browser-languagedetector
 vite-plugin-pwa workbox-window
 @hookform/resolvers
 Drop unused: none (all PRD-relevant).

 ---
 Step 1 — Supabase Project + Schema (Drizzle)

 Files to create:

- db/schema.ts — Drizzle schema for all 5 tables + 2 views (PRD §5)
- db/relations.ts — relations to auth.users
- drizzle.config.ts — points at db/schema.ts, out supabase/migrations/
- supabase/migrations/00_extensions.sql — pgcrypto
- supabase/migrations/06_rls.sql — RLS policies (PRD §5, hand-written; drizzle doesn't emit RLS)
- supabase/seed.sql — empty placeholder

 Tables (PRD §5 verbatim): profiles, prayer_phases, prayer_ledger, fasting_phases, fasting_ledger. Views:
 prayer_remaining, fasting_remaining.

 Workflow:

 1. Create Supabase project; copy URL + anon key + DB connection string.
 2. Define schema in Drizzle.
 3. drizzle-kit generate → review SQL → split per PRD §20 migration order (00–06).
 4. Hand-author RLS file (06_rls.sql) — enable row level security + 4 policies (self_select/insert/update/delete) on
 each user-data table.
 5. Apply via Supabase CLI: supabase db push or migration runner.
 6. Generate TypeScript types: supabase gen types typescript → app/types/database.ts. Drizzle inferred types for
 app-level use.

 Critical constraints (PRD §5): ledger sign checks, no note/reason fields anywhere, FK cascade on delete from
 auth.users.

 ---
 Step 2 — Supabase Client + Auth

 Files:

- app/lib/supabase.ts — createClient<Database>(url, anonKey) singleton
- app/lib/auth.ts — getSession(), signInWithMagicLink(email), signInWithGoogle(), signOut()
- app/hooks/use-session.ts — TanStack Query hook subscribing to onAuthStateChange
- app/routes/auth/sign-in.tsx, sign-up.tsx, callback.tsx
- app/routes/auth/layout.tsx — minimal, no nav

 Auth callback flow (PRD §13): /auth/callback → supabase.auth.exchangeCodeForSession → check profiles row exists → if
  not, insert defaults → redirect /onboarding/basics (or / if onboarded_at).

 Configure in Supabase dashboard: magic link template, Google OAuth provider, redirect URLs
 (<http://localhost:5173/auth/callback>, prod URL).

 ---
 Step 3 — Route Tree + Layouts + Guards

 Files:

- app/routes.ts — switch from index-only to nested config (RR7 config-based routing). Implement full PRD §6 tree.
- app/routes/_app/layout.tsx — bottom nav (mobile) / side nav (desktop). Children: dashboard, log, history,
 settings.
- app/routes/_onboarding/layout.tsx — progress bar, no main nav.
- app/routes/_auth/layout.tsx — minimal.
- app/lib/guards.ts — requireAuth(clientLoader), requireOnboarded, requireUnonboarded. Throw redirect() from
 clientLoader.

 Routes (PRD §6): /, /onboarding/{basics,baligh,prayers,fasting,menstruation,review}, /log, /history,
 /history/:entryId, /settings, /settings/{phases,data}, /auth/{sign-in,sign-up,callback}.

 ---
 Step 4 — Design System Primitives

 Use existing shadcn + base-ui. Components installed in pre-exec checklist C2. Component-by-screen mapping:

 | Component | Where used |
 |---|---|
 | button | everywhere |
 | card | PrayerCard, FastingCard, phase cards, review totals |
 | sheet | log overflow (quantity picker), mobile menus |
 | dialog | specific-day fasting date picker, generic modals |
 | alert-dialog | destructive confirms (delete entry, delete account, regen baseline) |
 | input | birth year, display name, custom days, email (sign-in) |
 | label | all form fields (a11y) |
 | radio-group | gender, baligh branch, fasting pattern presets |
 | slider | inconsistent missed_pct (1–99%) in prayer phases |
 | tabs | history filter (All/Prayer/Fasting) + sub-filter |
 | skeleton | loading remaining counts, history list |
 | sonner | toast notifications (rollback on optimistic-update error) |
 | calendar | specific-day fasting date picker |
 | popover | wraps calendar trigger, dropdown anchors |
 | select | locale, timezone, madhab, school grade (baligh), pattern picker |
 | switch | intent stacking toggle (settings, v2 disabled state) |
 | form | RHF + Zod wrapper for all forms |
 | separator | layout dividers (settings sections, dashboard) |
 | dropdown-menu | card overflow menus (log multiple, edit phase) |

 Skipped (overkill / against perf budget): data-table, command, accordion, carousel, hover-card, menubar, navigation-menu, breadcrumb, pagination (we use infinite scroll), context-menu, collapsible, toggle-group, table.

- Color tokens in app/app.css — calm primary (forest green / muted teal), neutrals, one positive accent. CSS vars +
 prefers-color-scheme for dark mode (PRD §14).
- Touch targets ≥44px. 360px baseline.

 Avoid full UI lib install (PRD §15 perf budget).

 ---
 Step 5 — Calculations (Pure Functions)

 File: app/lib/calculations.ts

 Implement verbatim from PRD §11:

- prayerBaselineForPhase(phase, profile): number — menstruation excluded for prayer.
- fastingBaselineForPhase(phase, profile): number — menstruation included for fasting; pattern-aware addition.
- eta(remaining, qadhaLast30Days): string — display only.

 Unit-test (vitest) — set up in this step; fixture cases for each pattern + female/male variants.

 ---
 Step 6 — Onboarding Wizard (P0 Core)

 Files (one per step):

- app/routes/_onboarding/basics.tsx — birth year picker (1940–current, default −25y), gender radio.
- app/routes/_onboarding/baligh.tsx — three branches per PRD §7 step 2.
- app/routes/_onboarding/prayers.tsx — PhaseEditor cards, pattern picker, slider, no-overlap validation, running
 total.
- app/routes/_onboarding/fasting.tsx — fasting start age, phases (presets + custom 0–30), optional postpartum.
- app/routes/_onboarding/menstruation.tsx — women-only, conditional in route guard.
- app/routes/_onboarding/review.tsx — display per-prayer × 5 + fasting total. Two CTAs.

 Shared components:

- app/components/onboarding/PhaseEditor.tsx
- app/components/onboarding/PatternPicker.tsx
- app/components/onboarding/ProgressBar.tsx

 State: local component state per PRD §7 ("Closing/reopening restarts"). React Hook Form + Zod for validation.

 On review-confirm (atomic): Supabase RPC commit_onboarding(profile_patch jsonb, phases jsonb):

 1. Upsert profile.
 2. Insert prayer_phases + fasting_phases.
 3. Compute baselines server-side (mirror calculations.ts in plpgsql or call from client and pass amounts).
 4. Insert baseline ledger rows (5 per prayer phase + 1 per fasting phase).
 5. Set profile.onboarded_at = now().

 Simpler v1 alternative (acceptable): do steps 1–5 client-side in a single transaction-less batch — RLS protects, but
  partial-failure risk. Recommend RPC.

 ---
 Step 7 — Dashboard + Daily Log Screen (P0 Core)

 Files:

- app/routes/_app/index.tsx — dashboard = log screen (PRD §6 maps / to dashboard but §8 layout is the log).
- app/routes/_app/log.tsx — full log per PRD §8.
- app/components/prayer/PrayerCard.tsx — name, remaining, [+1 Qadha], [Add miss], overflow → quantity sheet.
- app/components/prayer/PrayerLogButton.tsx
- app/components/fasting/FastingCard.tsx
- app/components/fasting/SpecificDayLogger.tsx — date picker only, no reason field (privacy).

 Data:

- app/lib/queries/use-remaining.ts — select * from prayer_remaining + fasting_remaining.
- app/lib/queries/use-log-mutation.ts — optimistic insert into ledger; rollback toast on error.
- app/lib/queries/use-next-prayer.ts — Aladhan API client-side, no storage (PRD §22).

 Floor remaining at 0 in display; preserve real value in DB (PRD §18).

 ---
 Step 8 — History Screen (P0)

 Files:

- app/routes/_app/history/index.tsx — tabs (All/Prayer/Fasting), sub-filter (All/Qadha/Misses/Adjustments/Baseline),
  50/page infinite scroll.
- app/routes/_app/history/$entryId.tsx — detail + delete confirmation, hard delete.
- app/components/history/EntryRow.tsx

 Combine prayer_ledger + fasting_ledger client-side via parallel queries; sort by logged_at desc.

 ---
 Step 9 — Settings (P0)

 Files:

- app/routes/_app/settings/index.tsx — display name, locale, timezone, madhab (informational), intent stacking
 toggle (v2 disabled).
- app/routes/_app/settings/phases.tsx — re-run wizard; on save, RPC regenerates baseline (delete
 entry_type='baseline' rows → recompute → insert; PRD §11 transaction).
- app/routes/_app/settings/data.tsx — export JSON (select everything user-owned, download blob), delete account
 (calls RPC that cascades + deletes auth.users row).
- app/routes/_app/settings/about.tsx — privacy explainer (PRD §12 verbatim copy), version, contact.

 ---
 Step 10 — i18n (id + en)

 Files:

- app/lib/i18n/index.ts — i18next init, id default, browser-language detector fallback to en.
- app/lib/i18n/locales/id.json, en.json — keys per screen: onboarding.*, log.*, history.*, settings.*, auth.*,
 privacy.*.
- Add lang attribute switching in app/root.tsx.

 Tone rules (PRD §14) bake into copy: neutral, no streak/red, never-shaming.

 ---
 Step 11 — PWA

 Files:

- vite.config.ts — add VitePWA({ registerType: 'autoUpdate', workbox: { runtimeCaching, navigateFallback } }).
- public/manifest.webmanifest — name, short_name, theme_color, background_color, display:standalone, icons
 192/512/maskable.
- public/icons/ — 192, 512, 512-maskable.
- app/lib/offline-queue.ts — IndexedDB queue for ledger writes; replay on reconnect (P0 minimal: queue inserts; P1
 better resolution).

 Install prompt logic deferred to P1 (PRD §17).

 ---
 Step 12 — Privacy Hardening

- Confirm Supabase encryption at rest (dashboard).
- No third-party analytics. Add Plausible only if user wants (skip P0).
- No Sentry on form values. If added later, configure breadcrumbs to drop ledger events.
- Review every screen — no note/reason field present in any form.

 ---
 Step 13 — Performance Budget Enforcement

- Code-split per route (RR7 default with config routing).
- Lucide imports per-icon (already correct in deps).
- Lighthouse manual run pre-deploy. CI gating deferred to P1.
- Bundle: <150KB initial JS, <300KB total first-load (PRD §15).

 ---
 Step 14 — Deploy to Netlify

- netlify.toml — [build] command = "npm run build", publish = "build/client".
- SPA fallback: [[redirects]] from = "/*" to = "/index.html" status = 200.
- Env vars in Netlify dashboard: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.
- Configure Supabase auth redirect URL to deployed domain.

 ---
 Critical Files (modified or created)

- app/routes.ts, app/root.tsx, react-router.config.ts, vite.config.ts, package.json
- db/schema.ts, drizzle.config.ts, supabase/migrations/*.sql
- app/lib/{supabase,auth,calculations,guards}.ts
- app/lib/queries/*
- app/lib/i18n/{index.ts,locales/{id,en}.json}
- app/routes/{_app,_onboarding,_auth}/*
- app/components/{ui,prayer,fasting,onboarding,history}/*
- public/manifest.webmanifest, public/icons/*
- netlify.toml

 ---
 Verification

 DB:

- supabase db reset then run migrations; assert \d profiles etc. match PRD §5.
- Insert as user A; query as user B → 0 rows (RLS). Use Supabase SQL editor + two test users.

 Calculations: vitest fixtures for male/female × 4 prayer patterns × 6 fasting patterns. Snapshot total counts.

 Onboarding e2e:

 1. Sign up → magic link → callback creates profile.
 2. Walk wizard, confirm review numbers match calculations.ts.
 3. Verify ledger has baseline rows; prayer_remaining view sums correctly.

 Log screen e2e:

 1. [+1 Qadha] → remaining decrements optimistically.
 2. Kill network → action queued → restore → row appears in DB.
 3. Specific day fasting insert with fasted_on set, no reason field anywhere in payload (DevTools Network).

 History:

- Filter combinations show correct subset.
- Delete entry → remaining count adjusts.

 Settings:

- Phase edit → baseline regen RPC → ledger has new baseline rows, old gone.
- Export JSON → contains profile + phases + ledger; nothing else.
- Delete account → auth.users row gone, all user data cascaded.

 Privacy audit: grep codebase for reason, note, description on ledger types — must return zero matches.

 PWA: Lighthouse PWA audit ≥ pass; install on Android Chrome; offline log entry works.

 Perf: Lighthouse Performance ≥ 90 on /log after onboarding.

 i18n: toggle locale → all visible copy switches; <html lang> updates.

 ---
 Ordering Summary (P0 ship)

 0 Foundations → 1 Schema → 2 Auth → 3 Routes/guards → 4 UI primitives → 5 Calculations → 6 Onboarding → 7 Log → 8
 History → 9 Settings → 10 i18n → 11 PWA → 12 Privacy → 13 Perf → 14 Deploy.

 P1 / P2 deferred per PRD §16.
