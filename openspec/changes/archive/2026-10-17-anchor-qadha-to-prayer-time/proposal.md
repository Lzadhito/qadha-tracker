# Proposal

## Why

The user ties each qadha to a daily prayer: they make up one prayer (often Fajr) several times a day, once after each of Fajr, Dhuhr, Asr, Maghrib and Isha. Today a log records only which prayer was made up and when, so the app can't show "Fajr after Maghrib", can't tell the five daily slots apart, and the day sheet blocks logging the same prayer twice on one day.

## What Changes

- Each qadha can carry an **anchor**: the daily prayer it was done with (Fajr, Dhuhr, Asr, Maghrib or Isha). Stored in a new nullable `anchor` column on `prayer_ledger`; existing rows stay empty.
- New sticky **"now" selector** at the top of the log screen with the five anchors. It starts from the time of day, the user can tap another, and a manual pick falls back to the clock once the clock moves to a different time slot.
- One-tap `+Qadha` logs with the selected anchor; the toast says which one ("Fajr logged · after Maghrib · Undo").
- Each prayer card shows today's count ("Today ×3") instead of only a check.
- The day-first sheet's prayer toggles become a **grid: prayer made up × anchor**. Logged cells are checked and disabled; the user ticks cells and saves once. This lets one prayer be logged several times on a day, one per anchor.
- History and day-entry rows show "after Maghrib" when an entry has an anchor.
- **Deploy order:** apply the migration before the new app version ships; until it exists, queued logs wait and the log, history and calendar reads error.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities
- `qadha-logging`: one-tap logging and its toast carry the anchor; the day-first sheet becomes a prayer × anchor grid; new requirements for the selector, stored anchor, today's count and anchor in history rows.

## Impact

- Database: new migration (`supabase/migrations/07_*.sql`) and `db/schema.ts` (nullable `anchor` text column with a check constraint).
- Logic: `app/lib/outbox.ts` (`LedgerRow.anchor`, day-set keyed by prayer and anchor), `app/lib/log-actions.ts`, `app/lib/queries/use-remaining.ts` (`fetchDayLog`, today and date hooks), new `app/lib/anchor.ts` for the clock rule and remembered pick.
- UI: `app/routes/_app/log.tsx`, `PrayerCard`, `DayLogSheet`, `PrayerLogSheet`, `HistoryRow`; i18n `en` and `id`.
- Out of scope: real prayer times or location, editing the anchor of an old entry, backfilling anchors on old rows, a unique rule on (prayer, anchor, day).
