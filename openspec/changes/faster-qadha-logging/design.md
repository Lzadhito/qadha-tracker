# Design

## Context

All log actions in `app/lib/log-actions.ts` are synchronous and local: they enqueue an op in the outbox and the sync pushes it later. "Logged today" and per-day state come from `useTodayPrayerLog` / `useDatePrayerLog`, which overlay pending outbox ops on server data. An `undo` op already carries a `dateKey`, and `undoTodayPrayer` first tries `cancelUnsentQadha` (drop an unsent insert) before queuing a delete. `sonner` is installed and the Toaster is mounted lazily in `root.tsx`; `AdjustSheet` already uses `toast`. `FullDaySheet` already logs all 5 prayers over a date range; `RemainingSheet` logs "all unlogged prayers" for today, one past day, or a range.

## Goals / Non-Goals

**Goals:**
- Logging a prayer just done is one tap, reversible for a few seconds from the toast.
- Backfilling a past day with any subset of prayers is one sheet, one save.
- No new backend, schema, or outbox op kinds.

**Non-Goals:**
- Prayer-time awareness or highlighting the current prayer.
- Undo for past-day logs (only the toast undo for the log just made, which is always today's).
- Changes to fasting logging.

## Decisions

**1. One tap logs immediately, protected by a toast Undo rather than a confirm step.**
The action is cheap to reverse (`undoTodayPrayer` already exists and is idempotent), so a confirmation dialog would just re-add the tap we are removing. Alternative: confirm dialog or long-press to log; rejected because the whole point is speed, and the existing local-first model makes undo trivially safe.

**2. The calendar becomes a secondary icon button on the card, not a gesture.**
A visible icon is discoverable and works the same on touch and desktop. Alternative: long-press `+Qadha` to open the sheet; rejected because it is invisible and conflicts with scrolling on mobile.

**3. A new day-first sheet replaces `RemainingSheet`; ranges stay with `FullDaySheet`.**
`RemainingSheet` mixes three jobs (today's rest, one past day, range of days) behind a range calendar. The new sheet does one: single day, per-prayer toggles. "All prayers over a range" is exactly what `FullDaySheet` does, so the range mode is dropped as a duplicate. Reuse: `useDatePrayerLog(dateKey)` to know what's logged (it works for today too, with pending ops overlaid), and a new small `logPrayers(prayers, loggedDates)` helper on top of the existing `qadhaRows`/`record` to write a chosen subset (`logRemainingToday` takes an exclude set; a direct include list is simpler for toggles). Alternative: extend `RemainingSheet` with toggles; rejected because its range-calendar state machine is the complexity we want to remove.

**4. Day choice is chips (`Today | Yesterday`) plus a single-select calendar behind an `Other date` expander.**
Keeps the common case calendar-free. Dates use the same noon-local `logged_at` stamping as the current sheets for past days; today uses `now()`, so WIB day keys stay consistent with `wibDateKey`.

**5. Toast undo reuses `undoTodayPrayer`.**
Because a one-tap log is always today's, no past-day undo is needed. If the sync has already pushed the insert, `undoTodayPrayer` falls through to the queued `undo` op as it does now.

## Risks / Trade-offs

- **Accidental tap while scrolling logs a qadha** → toast Undo, plus the card's existing undo icon stays available for today.
- **Double-tap logs two qadha** → intended to be allowed (a user may pray two days' worth of one prayer in a day); undo removes one at a time. Cards keep the existing `loggedToday` indicator.
- **Day-first sheet cannot log the same prayer twice for one day** (already-logged are disabled) → matches the day-set model used everywhere; multiple-per-day is only via one-tap or the per-prayer sheet.
- **Past-day toggles rely on `useDatePrayerLog` having loaded** → disable toggles and show the existing "checking" text while loading, so a not-yet-fetched logged prayer cannot be double-logged.
- **WIB vs local day at midnight**: "Yesterday" is computed from the WIB day key, not device-local date, to match how logs are bucketed.

## Open Questions

- Exact icon and toast copy; settle during implementation.
