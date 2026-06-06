# Qadha Tracker

A web app for Muslims to track and manage missed (*qadha*) prayers and Ramadan fasts.

## Features

- **Onboarding wizard** — enter birth year, gender, *baligh* age, menstruation averages (for women), and missed-prayer / fasting phases to calculate your baseline debt
- **Daily log** — mark each of the 5 prayers as qadha'd today; log fasting qadha
- **Bulk actions** — log all 5 prayers in one tap, or log remaining prayers for the day
- **Adjust remaining** — manually correct prayer/fasting counts at any time
- **History** — browse past log entries
- **ETA estimate** — shows how many days/months/years of qadha remain
- **Offline-capable PWA** — installable on mobile

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Router v7 (SSR + client loaders) |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI |
| Auth + DB | Supabase (Postgres) |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| i18n | i18next |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### Setup

```bash
npm install
```

Create `.env` (or `.env.local`):

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Test

```bash
npm test
```

## Privacy — What Stays on Your Device

Some personal data is intentionally **never sent to the database**. It is stored only in `localStorage` on the user's browser:

| Data | Storage | Reason |
|---|---|---|
| Gender | `localStorage` | Sensitive personal attribute |
| Name | `localStorage` | Optional display name, not needed server-side |
| Birth year | `localStorage` | Sensitive personal attribute |
| *Baligh* age + certainty | `localStorage` | Sensitive personal attribute |
| Average menstruation cycle length | `localStorage` | Sensitive health data |
| Average period duration (days) | `localStorage` | Sensitive health data |
| Average period days in Ramadan | `localStorage` | Sensitive health data |
| Prayer phases (start/end year, missed %) | `localStorage` | Onboarding input, only needed for baseline calculation |
| Fasting phases (start/end year, days missed) | `localStorage` | Onboarding input, only needed for baseline calculation |

> **Note:** localStorage is device-specific. On a new device, personal data and phase inputs will be absent — the app falls back to sensible defaults. The computed balances in Supabase are unaffected.

**What is stored in Supabase:**

| Data | Table |
|---|---|
| Per-prayer running balance (baseline + qadha logs) | `prayer_ledger` |
| Fasting running balance | `fasting_ledger` |

Only the computed outputs of onboarding (the baseline counts) are stored in Supabase — not the inputs used to derive them. Clearing `localStorage` loses the original phase configuration but does not affect logged balances.

## License

MIT — see [LICENSE](LICENSE).
