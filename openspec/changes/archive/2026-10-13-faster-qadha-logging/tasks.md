# Tasks

## 1. Logic helpers

- [x] 1.1 Add `logPrayers(prayers, loggedDates?)` to `app/lib/log-actions.ts` (reusing `qadhaRows`/`record`), and a WIB-based "yesterday" date helper beside `wibDateKey` in `app/lib/wib.ts`; verify with unit tests (subset logged once each, yesterday correct across the WIB midnight boundary) via the existing test runner
- [x] 1.2 Add a helper that turns a WIB day key into the noon-stamped `logged_at` the sheets use today (replacing the copy-pasted `setHours(12)` blocks where touched); verify the unit test matches the existing sheets' output for a sample date

## 2. One-tap logging

- [x] 2.1 Change `PrayerCard` so `+Qadha` calls `logPrayer(prayer)` directly and fires a `sonner` toast with an `Undo` action wired to `undoTodayPrayer`; verify manually: one tap logs, Undo restores the count, no sheet opens, works with the network off
- [x] 2.2 Add a calendar icon button on `PrayerCard` that opens the per-prayer date sheet (state in `log.tsx`); verify the sheet still logs a single day and a range
- [x] 2.3 Add i18n strings (en, id) for the toast, undo action, and icon label; verify no missing-key warnings in either locale

## 3. Today / Yesterday chips

- [x] 3.1 Add `Today | Yesterday` chips above the calendar in `PrayerLogSheet`, logging immediately and closing; verify Yesterday logs one qadha dated the previous WIB day and the calendar still works for older dates

## 4. Day-first backfill sheet

- [x] 4.1 Create the day-first sheet (replacing `RemainingSheet`): day chips plus single-select calendar behind `Other date`, five prayer toggles driven by `useDatePrayerLog`, logged ones checked and disabled, `Select all`, `Save` disabled when empty and while the day's log is loading; verify scenarios in `specs/qadha-logging/spec.md` by hand, including Dhuhr+Asr for yesterday logging exactly two rows
- [x] 4.2 Rewire `log.tsx` (the `+Qadha remaining` entry now opens the new sheet, lazy-loaded like the others) and delete `RemainingSheet.tsx` plus now-unused `logRemainingToday`/`resolveExclude` code and tests, if nothing else uses them; verify `tsc`/lint and tests pass and no dead strings remain in the locale files
- [x] 4.3 Add i18n strings (en, id) for the sheet; verify both locales render

## 5. Integration check

- [x] 5.1 Walk the exploration scenarios end to end on a phone-width viewport, online and offline (one-tap, undo, yesterday chip, day-first backfill, full-day range unchanged), then run the project's build and tests; verify all pass
