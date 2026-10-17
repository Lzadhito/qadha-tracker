# Tasks

## 1. Database and data plumbing

- [x] 1.1 Add migration `supabase/migrations/07_prayer_anchor.sql` (nullable `anchor` text on `prayer_ledger` with a check for the five prayer ids) and mirror it in `db/schema.ts`; verify it applies on a local Supabase and old rows keep null
- [x] 1.2 Add `anchor?: Prayer` to `LedgerRow` in `app/lib/outbox.ts` and an `anchor` argument through `logPrayer`/`logPrayers` in `app/lib/log-actions.ts`; verify an `outbox-sync` test that the pending op and the synced insert both carry the anchor
- [x] 1.3 Make the day log entry-based: `fetchDayLog` selects `anchor`, `applyToDaySet`/`withDayOps` and `useTodayPrayerLog`/`useDatePrayerLog` work on (prayer, anchor) entries, with helpers for per-prayer count and logged-cell keys; verify unit tests for two logs of one prayer, a null anchor, and undo lowering the count

## 2. Selector

- [x] 2.1 Add `app/lib/anchor.ts` with `anchorForClock(date)` and a remembered pick that expires when the clock slot changes (localStorage wrapped in try/catch); verify unit tests for each slot boundary and for expiry
- [x] 2.2 Add the five-button selector at the top of `log.tsx` reading and writing that state; add en/id strings; verify it starts from the clock and keeps a manual pick within the slot

## 3. One-tap and card

- [x] 3.1 Pass the selected anchor from `PrayerCard` into `logPrayer`, put the anchor in the toast text, and make the per-prayer date sheet's `Today` button use it while Yesterday/ranges stay unanchored; verify by hand that Fajr with Maghrib selected stores anchor Maghrib and Undo removes it
- [x] 3.2 Show today's count on each card ("Today ×N") in place of the check; verify count rises per tap and falls on undo, offline too

## 4. Day grid

- [x] 4.1 Rebuild `DayLogSheet` as a prayer × anchor grid (ticked cells, logged cells checked and disabled on a single day, no logged check over a range, Save disabled when empty) and add `logAnchored(cells, dates)` to `log-actions.ts`; verify a unit test that four ticked Fajr cells write four rows, and by hand that Fajr ×4 for yesterday saves in one go

## 5. History

- [x] 5.1 Show "after <prayer>" in `HistoryRow` when the entry has an anchor (select `anchor` in `use-history` and the calendar day sheet query); verify an anchored and an old entry both render

## 6. Integration

- [x] 6.1 Run the full flow on a phone-width viewport, online and offline, against a migrated database: select Maghrib, log Fajr, undo, backfill yesterday via the grid, check history; run typecheck, build and tests

## Workflow follow-up

- Apply the migration to production before deploying the app.
