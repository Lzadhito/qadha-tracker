## Context

`PrayerCard` has a calendar icon that opens `PrayerLogSheet`, a separate date sheet. `DayLogSheet` is the day-first sheet with a prayer x anchor grid. The home page also shows `AnchorSelector`, driven by `useAnchor` (clock default plus a manual pick saved in `localStorage`).

## Goals / Non-Goals

**Goals:**
- Remove the five-button selector from the home page.
- Make the per-prayer calendar icon open the day-first sheet for one prayer.

**Non-Goals:**
- No database or sync change. The `anchor` column stays and is still written.
- No redesign of the all-prayers `Log by day` sheet.

## Decisions

- **Reuse `DayLogSheet` with an optional `prayer` prop.** When set, it renders only that prayer's row and uses a title naming it. Why: one sheet to maintain, and the user asked for "nearly the exact" sheet. Skipped alternative: keep `PrayerLogSheet` and restyle it, which leaves two sheets to keep in step.
- **One-tap anchor = `anchorForClock(new Date())`.** Computed at tap time in `PrayerCard`, no state. Why: keeps the data useful and the tap count at one. Skipped alternative: stop writing anchors for one-tap, which would lose information for no UI benefit.
- **Shrink `anchor.ts` to the clock function.** Delete `useAnchor`, `resolveAnchor`, the pick type and the storage key. Why: the manual pick is the only reason they exist.
- **Delete `AnchorSelector` and `PrayerLogSheet`.** Nothing else uses them.
- **Single sheet instance in `log.tsx`.** It holds the chosen prayer (or none for all) and passes it to `DayLogSheet`; the lazy-import for `PrayerLogSheet` goes away.

## Risks / Trade-offs

- Users who liked picking the anchor for one-tap logging lose that. They can still backfill with any anchor through the sheets.
- The single-prayer sheet defaults to Yesterday like `Log by day`, while the old date sheet had a prominent Today button. Today stays one tap away.
- Assumption: one-tap anchor from the clock was not explicitly requested. If it should store no anchor, change the one call in `PrayerCard`.
