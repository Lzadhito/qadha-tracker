# Proposal

## Why

Every qadha day shows the same single dot, so a day with one prayer looks the same as a day with a full catch-up. The dot should say how much was done at a glance. A row of dots does not scale, because a calendar cell only fits about five.

## What Changes

- A marked day shows one dot per qadha done that day, up to 5.
- Above 5, the dots are replaced by the number (for example `7`).
- Prayers and fasts count the same, in the same colour. Each unit of qadha is one count, so an entry with amount 2 counts as 2.
- Days with no qadha stay unmarked. Tapping a day still opens its entries sheet.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `qadha-calendar`: the "Dots mark qadha days" requirement now says how many dots show and when a number replaces them.

## Impact

- `app/components/ui/calendar.tsx` (day cell rendering) and `app/components/calendar/QadhaCalendar.tsx` (passes a per-day count).
- `app/lib/month-qadha.ts` gets a small count helper, with a test in `month-qadha.test.ts`.
- The screen-reader label in `en.json` / `id.json` should include the count.
- No database, API or dependency changes.
