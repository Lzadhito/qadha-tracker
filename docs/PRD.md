Qadha Tracker — Product Requirements Document

Reading order: Sections 1–4 establish context. Sections 5–11 are the core implementation spec. Section 17 defines what to build first. Implement in P0 → P1 → P2 order.

1. Project overview
What
A web app that helps Muslims track and chip away at years of missed obligatory prayers (fardhu shalah) and fasts (puasa). Users estimate their qadha debt through a guided onboarding, then log completed makeup prayers/fasts and any new misses over time.
Why
Muslims who return to practice after years of neglect often face a daunting and uncountable debt of qadha. Existing prayer apps treat qadha as an afterthought (a single number field). No app handles the messy reality: imprecise memory, life phases of varying observance, women's menstruation rules, and the deep privacy required for something this personal.
Who
Primary persona: a returning Muslim, age 20–40, who has decided to make up missed obligations and needs a trustworthy tool for a multi-year journey. Mobile-first, primarily Indonesian audience.
Success metrics for v1

Onboarding completion rate > 70%
D30 retention > 30%
Average logging session under 60 seconds
Zero data-loss incidents

1. Tech stack (decided)

Frontend: React + React Router
Backend: Supabase (Postgres, Auth, RLS, Edge Functions)
Styling: Tailwind CSS (or equivalent utility-first)
State: TanStack Query for server state, React state/Context for local
Form: React Hook Form + Zod for validation
i18n: react-i18next (Bahasa Indonesia primary, English secondary)
PWA: Vite PWA plugin or equivalent
Hosting: Netlify
Form factor: Web only (PWA-installable, mobile-first responsive)

1. Core principles
These shape every decision. Re-read before any meaningful change.

Privacy by omission. Don't collect data we don't need. Never store the reason a prayer or fast was missed. The user's relationship with their own faults is between them and Allah.
Honest and non-shaming tone. Missed prayers and broken fasts are framed neutrally. No red marks, no streak penalties, no moralizing copy. The product is a tool, not a judge.
Flexible to imprecise memory. Most users won't know exact dates. Onboarding must work for someone who only remembers "I started skipping in college."
Trustworthy over time. This app is used for years. Backups, undo, data export, and clear data handling are non-negotiable.
Mobile-first. The Indonesian audience accesses the web primarily via phone. Every screen designed at 360px first, then scaled up.

1. Glossary (Islamic terms used in this PRD)
TermMeaningFardhuReligiously obligatoryShalah / SalahThe five daily prayers (Subuh, Zuhur, Asar, Maghrib, Isya)PuasaFasting, particularly during RamadanQadhaMaking up a missed obligationBalighThe age of religious accountability (puberty); ~age 15 default if unknownRamadanThe Islamic month of fasting (~30 days/year)KaffarahExpiation owed for certain types of fast-breakingFidyahFeeding the poor in lieu of fastingTartibChronological order — some madhabs require qadha in orderNifasPostpartum bleeding (~40 days)MadhabSchool of Islamic jurisprudence (Shafi'i, Hanafi, Maliki, Hanbali)SatrConcealment of one's sins; the Islamic value informing the privacy stance

2. Data model
Naming conventions

All tables snake_case, plural.
Primary keys are UUIDs unless they're foreign references.
Every user-data table has user_id uuid not null references auth.users on delete cascade.
Every user-data table has RLS enabled with policies restricting access to auth.uid() = user_id.

Tables
sql-- Profile: extends auth.users with app-specific data
create table profiles (
  user_id              uuid primary key references auth.users on delete cascade,
  display_name         text,
  birth_year           int  not null,
  baligh_age           int  not null default 15,
  baligh_certain       bool not null default false,
  gender               text not null check (gender in ('male','female')),
  -- women only, used in calculations
  avg_cycle_days       int,
  avg_period_days      int,
  avg_period_in_ramadan int,
  -- fasting may start at a different age than baligh in practice
  fasting_start_age    int,
  -- fiqh preferences
  madhab               text check (madhab in ('shafii','hanafi','maliki','hanbali')),
  intent_stacking      bool not null default false,
  -- locale + timezone
  locale               text not null default 'id',
  timezone             text not null default 'Asia/Jakarta',
  onboarded_at         timestamptz,
  created_at           timestamptz not null default now()
);
sql-- Prayer phases: chunks of life the user describes during onboarding
create table prayer_phases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  start_year   int not null,
  end_year     int not null,
  pattern      text not null check (pattern in
                 ('consistent','inconsistent','mostly_missed','completely_missed')),
  missed_pct   int not null check (missed_pct between 0 and 100),
  created_at   timestamptz not null default now(),
  check (start_year <= end_year)
);
create index prayer_phases_user_idx on prayer_phases(user_id);
sql-- Prayer ledger: append-only log of every change to qadha count
create table prayer_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  prayer          text not null check (prayer in
                    ('subuh','zuhur','asar','maghrib','isya')),
  entry_type      text not null check (entry_type in
                    ('baseline','miss','qadha','adjustment')),
  amount          int  not null,
  source_phase_id uuid references prayer_phases(id) on delete set null,
  logged_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint prayer_amount_sign_matches_type check (
    (entry_type in ('baseline','miss') and amount > 0) or
    (entry_type = 'qadha' and amount < 0) or
    (entry_type = 'adjustment')
  )
);
create index prayer_ledger_user_prayer_idx on prayer_ledger(user_id, prayer);
create index prayer_ledger_user_logged_idx on prayer_ledger(user_id, logged_at desc);
sql-- Computed remaining count per prayer per user
create view prayer_remaining as
select user_id, prayer, sum(amount) as remaining
from prayer_ledger
group by user_id, prayer;
sql-- Fasting phases: per-Ramadan granularity
create table fasting_phases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  start_year   int not null,
  end_year     int not null,
  pattern      text not null check (pattern in
                 ('all_fasted','few_missed','half','few_fasted','none_fasted','custom')),
  days_missed_per_ramadan int not null check (days_missed_per_ramadan between 0 and 30),
  created_at   timestamptz not null default now(),
  check (start_year <= end_year)
);
create index fasting_phases_user_idx on fasting_phases(user_id);
sql-- Fasting ledger
create table fasting_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  entry_type      text not null check (entry_type in
                    ('baseline','miss','qadha','adjustment')),
  amount          int  not null,
  fasted_on       date,
  source_phase_id uuid references fasting_phases(id) on delete set null,
  logged_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint fasting_amount_sign_matches_type check (
    (entry_type in ('baseline','miss') and amount > 0) or
    (entry_type = 'qadha' and amount < 0) or
    (entry_type = 'adjustment')
  )
);
create index fasting_ledger_user_idx on fasting_ledger(user_id);
sql-- Computed remaining fasting count per user
create view fasting_remaining as
select user_id, sum(amount) as remaining
from fasting_ledger
group by user_id;
Critical schema notes

No note field anywhere. Free text is sensitive and we don't store it.
No break_reason field on fasting_ledger. We don't ask why a fast was broken.
Ledger is append-only by convention — users can delete their own entries via the history screen for undo.

RLS policies
Apply to profiles, prayer_phases, prayer_ledger, fasting_phases, fasting_ledger:
sqlalter table <table_name> enable row level security;
create policy "self_select" on <table_name> for select using (auth.uid() = user_id);
create policy "self_insert" on <table_name> for insert with check (auth.uid() = user_id);
create policy "self_update" on <table_name> for update using (auth.uid() = user_id);
create policy "self_delete" on <table_name> for delete using (auth.uid() = user_id);
Views (prayer_remaining, fasting_remaining) inherit RLS from underlying tables.

1. Routes
/                         → dashboard (redirects to /onboarding/basics if !profile.onboarded_at)
/onboarding               → wizard layout
  /onboarding/basics      → birth year, gender
  /onboarding/baligh      → baligh age determination
  /onboarding/prayers     → prayer phases
  /onboarding/fasting     → fasting basics + phases
  /onboarding/menstruation→ women only — cycle/period averages
  /onboarding/review      → calculated totals + confirm
/log                      → daily log screen (the core daily flow)
/history                  → ledger view (filterable by obligation type)
/history/:entryId         → entry detail + delete
/settings                 → profile, fiqh prefs, edit phases, data export
/settings/phases          → re-run phase calculation
/settings/data            → export, delete account
/auth/sign-in
/auth/sign-up
/auth/callback            → handles magic link + OAuth redirects
Layouts

Auth layout wraps /auth/*— minimal, no nav.
Onboarding layout wraps /onboarding/* — progress bar, no main nav.
App layout wraps everything else — bottom nav on mobile (Log / History / Settings), side nav on desktop.

Route protection

Unauthenticated users on protected routes → redirect to /auth/sign-in.
Authenticated but un-onboarded users → redirect to /onboarding/basics.
Onboarded users on /onboarding/* → redirect to /.

Implement with React Router 6.4+ loaders that throw redirects.

1. Onboarding wizard
Step 1: Basics (/onboarding/basics)

Birth year (year picker, default to 25 years ago, range: 1940–current)
Gender (male / female radio — required for menstruation logic)

Step 2: Baligh (/onboarding/baligh)
Three branches:

"I remember" → year picker → save baligh_age, baligh_certain = true
"Help me figure it out" → school grade picker (SD/SMP/SMA mapped to ages 7/13/16); for women, optional first-period age
"I don't know" → default to 15. Show note: "Most scholars use age 15 as the default when uncertain."

Step 3: Prayer phases (/onboarding/prayers)

Title: "Walk through your life since you became baligh."
Dynamic phase cards: start year, end year, pattern picker.
Patterns:

Consistent (no qadha needed)
Inconsistent — slider 1–99%, default 50%
Mostly missed — 80%
Completely missed — 100%

Validation: no overlap, range within [baligh_year, current_year], gaps allowed.
Running total displayed.

Step 4: Fasting (/onboarding/fasting)

Confirm fasting start age (default = baligh_age).
Fasting phases with patterns:

All fasted (0/Ramadan; women: avg period days)
Few missed (5/Ramadan; women: 5 + avg period)
Half (15/Ramadan)
Few fasted (25/Ramadan)
None fasted (30/Ramadan)
Custom (0–30)

Optional postpartum question: "Were any Ramadans during this period affected by childbirth?" Each selected year adds 30 days.

Step 5: Menstruation (/onboarding/menstruation) — women only

Average cycle length (default 28)
Average period length (default 6)
Average period days during Ramadan (default = avg_period_days)
Helper: "Excluded from prayer qadha (menstruation exempts you), counted toward fasting qadha (must be made up later)."

Step 6: Review (/onboarding/review)

Display totals: prayer (per prayer × 5) + fasting (single number).
Big honest numbers, not euphemized.
Two CTAs: "Looks right — start" / "Let me adjust".
On confirm: write baseline ledger entries, set profile.onboarded_at.

Implementation notes

Save progress to local component state. Closing/reopening restarts. Re-runnable from settings.

1. Daily log screen (/log)
Loads <200ms; one screen, no scrolling on phone.
Layout (mobile, 360px baseline)
┌─────────────────────────────────┐
│ Today, 8 May                    │
│ Next: Asar in 23 min            │
├─────────────────────────────────┤
│  Subuh         9,243 remaining  │
│  [+1 Qadha]    [Add miss]       │
│                                 │
│  Zuhur         9,243 remaining  │
│  [+1 Qadha]    [Add miss]       │
│                                 │
│  Asar          9,243 remaining  │
│  [+1 Qadha]    [Add miss]       │
│                                 │
│  Maghrib       9,243 remaining  │
│  [+1 Qadha]    [Add miss]       │
│                                 │
│  Isya          9,243 remaining  │
│  [+1 Qadha]    [Add miss]       │
├─────────────────────────────────┤
│  Fasting       287 days remain  │
│  [Log 1 fast]  [Add missed day] │
│  [Log specific day...]          │
└─────────────────────────────────┘
[Bottom nav: Log | History | Settings]
Behavior

+1 Qadha (primary, positive) — optimistic update; insert entry_type='qadha', amount=-1.
Add miss (secondary, neutral) — never red; insert entry_type='miss', amount=+1.
Log multiple — overflow on each card opens a sheet with quantity picker.
Log specific day (fasting) — date picker only; inserts entry_type='miss', amount=1, fasted_on=<date>. No reason field.
All actions optimistic; rollback on error with toast.

Empty state
If remaining for any prayer = 0: "Done with Subuh qadha 🌙" (one of the few places emoji is appropriate).

1. History screen (/history)
Read-only ledger with delete capability.

Filter tabs: All / Prayer / Fasting
Sub-filter: All / Qadha / Misses / Adjustments / Baseline
List newest-first.
Tap entry → detail page with delete button.
Pagination: 50 per page, infinite scroll.

Delete

Confirmation: "Delete this entry? Your remaining count will adjust accordingly."
Hard delete.

1. Settings screen (/settings)

Profile — display name, locale, timezone
My phases (/settings/phases) — re-run wizards; recomputes baseline on save
Fiqh preferences — madhab picker (informational v1); intent stacking toggle (v2)
Data (/settings/data)

Export all data as JSON
Delete account + all data

About — privacy explainer, version, contact

1. Calculations
Prayer phase baseline
tsfunction prayerBaselineForPhase(phase: PrayerPhase, profile: Profile): number {
  const years = phase.end_year - phase.start_year + 1;
  const daysGross = years * 365;

  // Menstruation: NOT counted for prayer (exempted entirely)
  const menstruationDays = profile.gender === 'female' && profile.avg_period_days
    ? years *12* profile.avg_period_days
    : 0;

  const eligibleDays = daysGross - menstruationDays;
  return Math.round(eligibleDays * (phase.missed_pct / 100));
}
Run for each phase, insert 5 baseline ledger entries (one per prayer) with the same amount.
Fasting phase baseline
tsfunction fastingBaselineForPhase(phase: FastingPhase, profile: Profile): number {
  const ramadans = phase.end_year - phase.start_year + 1;
  let perRamadan = phase.days_missed_per_ramadan;

  // Menstruation: COUNTED for fasting (must be made up).
  // For 'all_fasted'/'few_missed' presets, user reported missed days excluding
  // menstruation, so we add it. Other presets implicitly include it.
  const includesMenstruationImplicitly =
    ['half','few_fasted','none_fasted','custom'].includes(phase.pattern);

  if (
    profile.gender === 'female' &&
    profile.avg_period_in_ramadan &&
    !includesMenstruationImplicitly
  ) {
    perRamadan += profile.avg_period_in_ramadan;
  }

  return Math.min(ramadans *perRamadan, ramadans* 30);
}
Remaining count
tsconst { data } = await supabase
  .from('prayer_remaining')
  .select('prayer, remaining')
  .eq('user_id', userId);
// Floor at 0 in display; preserve actual value in DB
Completion ETA (display only, client-side)
tsfunction eta(remaining: number, qadhaLast30Days: number): string {
  if (remaining <= 0) return 'Done';
  if (qadhaLast30Days === 0) return 'Start logging to see projection';
  const perDay = qadhaLast30Days / 30;
  const daysLeft = Math.ceil(remaining / perDay);
  if (daysLeft < 30) return `~${daysLeft} days at current pace`;
  if (daysLeft < 365) return `~${Math.round(daysLeft / 30)} months at current pace`;
  return `~${(daysLeft / 365).toFixed(1)} years at current pace`;
}
Baseline regeneration on phase edit
When phases are edited:

Begin transaction.
Delete all entry_type='baseline' rows for that user.
Re-run baseline calculation for all current phases.
Insert new baseline rows.
Commit.

Wrap as a Supabase Edge Function or RPC for atomicity.

1. Privacy architecture
What we store

Profile (name, birth year, gender, fiqh prefs, locale, timezone)
Phases (year ranges + pattern only)
Ledger entries (counts, types, timestamps)

What we never store

Reasons for any missed prayer or fast
Free-text notes on entries
Specific incident details beyond date and count
Third-party analytics tied to user identity

Privacy explainer (shown during onboarding + in settings)

How we handle your data
We store the count of prayers and fasts you owe, the dates you logged actions, and your basic profile. Nothing else.
We do not ask why a prayer or fast was missed. We do not store notes. We do not track patterns. That is between you and Allah.
Your data is encrypted at rest and only you can read it. You can export it or delete your account at any time from Settings.

Operational requirements

No third-party analytics tied to user actions. Plausible or self-hosted Umami acceptable; Google Analytics not.
No Sentry on form values. If using Sentry, configure breadcrumbs to skip ledger events; strip request/response bodies.
Disable Supabase query logging on production for ledger tables.
Confirm Supabase encryption at rest. Encrypt manual backup exports.
Account deletion is hard delete (FK cascade). Must wipe auth.users row.

1. PWA setup
Manifest (public/manifest.webmanifest)

name: "Qadha Tracker" (or final name)
short_name: "Qadha"
display: standalone
theme_color, background_color
Icons: 192px, 512px, maskable variant

Service worker

Cache app shell.
Queue ledger writes when offline; replay on reconnect.

Use Workbox or equivalent.
Install prompt

Show after third successful login session, not first visit.
Dismissible; never re-prompt more than once per month.
iOS: one-time tooltip with manual "Share → Add to Home Screen" instructions.

1. Auth

Primary: Magic link (email).
Secondary: Google OAuth.
Skip: Email + password.

Supabase native handling. Configure redirect URLs and email templates.
Auth callback
/auth/callback handles both magic link and OAuth. On success, check if profile exists; if not, create with defaults and redirect to onboarding.

1. UI/UX guidelines
Tone

Neutral, kind, never judgmental.
Avoid streak/gamification language.
Celebrate completions sparingly and warmly.
Never red for "missed" actions.

Visual

Mobile-first, 360px baseline.
Touch targets ≥44px.
Sticky bottom CTA on log screen.
System font stack base; one custom font max for branding (font-display: swap).
Calm primary color (forest green or muted teal); neutrals; one positive accent.
Dark mode from v1 (CSS variables + prefers-color-scheme).

Animation

Subtle. 150–200ms transitions max. No confetti, no sound.

Accessibility

WCAG AA contrast.
Keyboard reachable.
Screen reader labels on icon buttons.
lang attribute per locale.

1. Performance budget
Hard targets, enforce via Lighthouse CI:

Initial JS bundle: <150 KB gzipped
Total first-load: <300 KB
TTI: <3s on 4G
Lighthouse Performance: ≥90

Discipline

Code-split by route.
No full UI library (Radix/Headless UI + Tailwind).
Lazy-load icons (Lucide individual imports).
Defer non-critical fonts.
Use date-fns (tree-shakeable), not Moment.

1. MVP scope
P0 — ship to yourself first

Auth (magic link + Google OAuth)
Profile creation
Onboarding wizard (steps 1–6)
Prayer + fasting phase tables, baseline generation
Daily log screen with +1 Qadha and Add miss for prayers + fasting
Specific-day fasting logger (date picker only, no reason)
Remaining counts on dashboard
History screen (read-only, with delete)
Settings: profile edit, phase re-run, data export (JSON), account delete
Privacy explainer screen
RLS on every table
PWA manifest + minimal service worker
Mobile-first responsive (all flows working at 360px)
i18n scaffolding (one locale: id)
Performance budget enforced

P1 — ship to others

ETA projection on dashboard
Bulk adjustment flow in settings
Onboarding "I don't know my baligh age" proxy questions (full impl)
Postpartum granular handling per Ramadan year
Email reminders via Supabase Edge Function
Second locale (English)
Add-to-home-screen prompt + iOS tutorial
Better offline handling for log screen
Lighthouse CI in deploy pipeline

P2 — later

Push notifications (Android + installed PWA only)
Daily prayer log + streak (separate from qadha)
Madhab-specific behavior (intent stacking, tartib)
Kaffarah tracking (manual, optional)
Fidyah option
Insights
Ramadan mode

Explicitly NOT building

Social features (no leaderboards, no sharing) — ever
Push notifications in v1
Email + password auth
Reason-tracking for any missed obligation
Notes field on ledger entries

1. Open questions / fiqh decisions
Mark with // FIQH-TBD: <question> in code where relevant.

Forgetful eating during Ramadan. App default: not counted. Confirm with scholar.
Pregnancy/breastfeeding. App default: qadha (safer). Add settings override for fidyah opinion.
Intent stacking. Setting exists but informational only in v1. Confirm v2 behavior.
Tartib. v1 allows any order. v2 may add guided order mode.
Negative remaining display. Floor at 0 in UI; preserve real value in DB.

1. Recommended folder structure
src/
  app/
    router.tsx
    layouts/
      AppLayout.tsx
      AuthLayout.tsx
      OnboardingLayout.tsx
  routes/
    dashboard/
    log/
    history/
    settings/
    onboarding/
    auth/
  components/
    ui/                 # primitives (Button, Card, Sheet)
    prayer/             # PrayerCard, PrayerLogButton
    fasting/            # FastingCard, SpecificDayLogger
    onboarding/         # PhaseEditor, PatternPicker
  lib/
    supabase.ts
    queries/            # TanStack Query hooks
    calculations.ts
    i18n/
  styles/
  types/
public/
  manifest.webmanifest
  icons/
supabase/
  migrations/
  seed.sql

2. Migration order

00_extensions.sql — create extension if not exists "pgcrypto";
01_profiles.sql
02_prayer_phases.sql
03_prayer_ledger.sql + view
04_fasting_phases.sql
05_fasting_ledger.sql + view
06_rls.sql — all RLS policies in one file

1. Constraints and non-goals

Not a prayer-time app. Don't compute prayer times. If "next prayer in X" is shown, fetch from Aladhan API client-side; don't store.
Not a Quran/dhikr app. Single purpose.
Not a community app. No social features.
Not a fiqh authority. Reasonable defaults; users consult their own scholar.

1. Initial dev tasks

Scaffold project (Vite + React + React Router + Tailwind + TanStack Query + Supabase).
Set up Supabase project; run migrations from Section 20.
Configure Auth (magic link + Google OAuth); set redirect URLs.
Build auth flow.
Build app layout shell (bottom nav mobile, side nav desktop, route protection).
Build onboarding wizard end-to-end.
Build dashboard / log screen.
Build history screen.
Build settings (data export + delete account).
Add PWA manifest + service worker.
i18n scaffolding + Bahasa Indonesia strings.
Privacy explainer screen.
Lighthouse CI.
Deploy to Cloudflare Pages.

Last updated: drafting phase. Revise after first scholar consultation on Section 18.

Save the above as PRD.md in your project root (or docs/PRD.md) and Claude Code can use it as the source of truth. Two practical follow-ups when you start:

Pin a project name before you scaffold — affects the manifest, brand color, and any copy. If you don't have one, "Qadha" or "Lunaqadha" or "Tartib" are decent placeholders.
Get one fiqh review of Section 18 before you ship to anyone but yourself. Even a 30-minute call with a trusted ustadz catches things the spec can't.

Want me to also draft the actual SQL migration files split out (one file per table, ready to drop into supabase/migrations/), or the i18n string keys for the Bahasa Indonesia copy?
