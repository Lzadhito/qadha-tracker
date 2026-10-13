# Proposal

## Why

Qadha is logged many times a day, usually chained to a mandatory prayer, and today it takes two taps (`+Qadha` then `Right now`) because the card always opens a sheet whose main job is picking a date. Backfilling a past day is worse: the calendar is per-prayer, so "yesterday I did Dhuhr and Asr" means opening two sheets and picking the same date twice, or logging all remaining prayers for that day when only some were prayed.

## What Changes

- Tapping `+Qadha` on a prayer card logs that prayer for today immediately (one tap, no sheet) and shows a toast with an `Undo` action.
- A secondary calendar icon next to `+Qadha` on each card opens the existing per-prayer date sheet for the rare "this prayer, over a range of days" case.
- The per-prayer date sheet gets `Today | Yesterday` quick chips above the calendar.
- New day-first sheet: pick a day (default Yesterday, chips plus calendar), then toggle which of the 5 prayers were prayed that day. Prayers already logged that day show as checked and cannot be toggled. One `Save` logs the chosen set.
- The day-first sheet replaces the `+Qadha remaining` sheet (RemainingSheet). It is single-day only, with a `Select all` preset covering "log the rest of this day". Ranges of whole days stay with the existing `Full day` sheet, so RemainingSheet's range mode is removed as a duplicate.

## Capabilities

### New Capabilities
- `qadha-logging`: how a qadha prayer is recorded from the log screen: one-tap logging for today, undo, quick date shortcuts, and day-first multi-prayer backfill. (No specs exist yet in `openspec/specs/`, so this establishes the first one.)

### Modified Capabilities

(none)

## Impact

- UI: `app/routes/_app/log.tsx`, `app/components/prayer/PrayerCard.tsx`, `PrayerLogSheet.tsx`, `RemainingSheet.tsx` (replaced or reworked into the day-first sheet), i18n strings in `app/lib/i18n/locales/{en,id}.json`.
- Logic: reuses `logPrayer`, `logRemainingToday`, `undoTodayPrayer`, and `useDatePrayerLog` in `app/lib/`. No new backend, schema, or outbox op kinds are expected; `sonner` is already installed and mounted.
- No database migration, no API change. The offline outbox behavior is unchanged: every action remains local-first.
- Out of scope: prayer-time awareness or highlighting the "current" prayer, undo of past-day logs, fasting-card changes.
