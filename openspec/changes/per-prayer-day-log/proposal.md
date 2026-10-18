## Why

The "Doing qadha after" row of five buttons on the home page takes space and asks the user to pick something on every visit. The per-prayer calendar icon opens a different, older date sheet than the "Log by day" sheet, so the two flows look and behave differently.

## What Changes

- Remove the "Doing qadha after" selector (five buttons) from the home page.
- One-tap `+Qadha` still records an anchor, but it is always the prayer slot of the device clock. There is no manual pick any more.
- The calendar icon beside each prayer's `+Qadha` opens the same day-first sheet as `Log by day`, limited to that one prayer: day or range, then one row of "done after" cells, one Save.
- Remove the old per-prayer date sheet (`PrayerLogSheet`) and the stored manual pick.
- Out of scope: the database (the `anchor` column stays and is still written), the `Log by day` sheet for all prayers, history rows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `qadha-logging`: removes the prayer-time selector, changes where the one-tap anchor comes from, and makes the per-prayer date control open the day-first sheet for that prayer only.

## Impact

- UI: `app/routes/_app/log.tsx`, `PrayerCard.tsx`, `DayLogSheet.tsx`; delete `AnchorSelector.tsx` and `PrayerLogSheet.tsx`.
- Logic: `app/lib/anchor.ts` loses the pick and storage (keeps `anchorForClock`); its test shrinks.
- i18n: drop unused `anchor.*` and `prayerCard.*` date-sheet strings, add a title for the single-prayer sheet.
- No database, API, or sync changes.
