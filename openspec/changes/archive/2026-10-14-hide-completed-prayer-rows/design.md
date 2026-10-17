# Design

## Context

The log screen (`app/routes/_app/log.tsx`) maps all five prayers to `PrayerCard`. It already has `prayers.data` (remaining per prayer, outbox overlay applied, clamped at 0 as `displayRemaining`) and `todayDone` (set of prayers logged today). Both update instantly on a tap, since pending outbox ops are merged in.

## Goals / Non-Goals

**Goals:**
- Hide paid-off rows with no new state and no data changes.

**Non-Goals:**
- Changing the fasting card, the history page, or the calendar.

## Decisions

- **Stateless filter in the screen, not in `PrayerCard`.** Show a prayer unless `displayRemaining === 0 && !todayDone.has(prayer)`. Skipped: remembering "was visible on load" in a ref; it needs extra state and gives the same result almost everywhere.
- **Logged-today exception.** Keeps the row's undo control after the last qadha is logged. Without it the row would vanish under the user's finger and only the short-lived toast could undo. Trade-off: a prayer paid off earlier today stays until tomorrow.
- **Loading-safe.** A prayer is hidden only when its remaining count is a loaded number, so a cold start never flickers.
- **Empty state.** If the filtered list is empty, render one new i18n string (`log.allPrayersPaidOff`, en + id) instead of an empty card.

## Risks / Trade-offs

- Hidden rows lose the per-row calendar button → `Log by day` still reaches every prayer.
- Over-logged prayers (negative remaining) also hide, since they are clamped to 0 → same as paid off, acceptable.
