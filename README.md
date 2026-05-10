# Qadha Tracker

Privacy-first PWA for Muslims tracking qadha (missed prayers + fasts). Mobile-first, Indonesian audience.

## Setup

### Pre-execution
- Supabase project created + secrets in `.env.local`
- Google OAuth configured
- Supabase CLI installed + linked
- shadcn components installed
- See `docs/Tech Plan.md` Pre-Execution Checklist

### Development

```bash
npm install
npm run dev
```

Dev server: `http://localhost:5173`

### Building

```bash
npm run build
```

Outputs SPA at `build/client/`.

## Tech stack

- Frontend: React 19 + React Router v7 (SPA mode)
- Backend: Supabase (Postgres, Auth, RLS)
- Styling: Tailwind CSS v4 + shadcn/ui
- Form: React Hook Form + Zod
- State: TanStack Query
- i18n: react-i18next (id + en)
- ORM: Drizzle (schema + migrations)
- Hosting: Netlify (static SPA)

## Project structure

```
app/
  routes/          # RR7 file-based routes
  components/      # UI components
  lib/             # utilities, queries, auth
  app.css          # global styles
db/
  schema.ts        # Drizzle schema
supabase/
  migrations/      # SQL migrations
public/
  manifest.webmanifest  # PWA manifest
docs/
  PRD.md          # product spec
  Tech Plan.md    # implementation plan
```

## Docs

- **PRD**: `docs/PRD.md` — complete spec, data model, screens, calculations
- **Tech Plan**: `docs/Tech Plan.md` — step-by-step implementation sequence
