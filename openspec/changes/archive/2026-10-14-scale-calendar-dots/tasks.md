# Tasks

## 1. Count helper

- [x] 1.1 Add a per-day count helper in `app/lib/month-qadha.ts` (sum of absolute amounts) and unit tests in `month-qadha.test.ts` for one entry, mixed prayer and fasting, an amount of 2, and an empty day; verify `npm test` passes

## 2. Calendar rendering

- [x] 2.1 In `QadhaCalendar.tsx`, build a `Map<dayKey, count>` from `days` and pass it to `Calendar`; verify the app type-checks
- [x] 2.2 In `app/components/ui/calendar.tsx`, replace the `::after` dot with a row of up to 5 dots, or the number when the count is above 5, keeping the selected-day colour swap; verify in the browser with days of 1, 5 and 7 qadha
- [x] 2.3 Update the `calendar.hasQadha` strings in `en.json` and `id.json` to include the count; verify the sr-only text reads correctly
- [x] 2.4 Verify offline: log a qadha with no network and see the dots grow immediately, then undo and see them shrink or disappear
