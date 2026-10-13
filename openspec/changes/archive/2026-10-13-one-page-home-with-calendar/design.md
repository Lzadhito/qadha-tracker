# Design

## Context

See proposal.md. Current state that shapes the approach:
- `_app/layout.tsx` renders a sidebar plus a bottom nav from one `navItems` list; `index.tsx` redirects `/` to `/log`. `/log` is the home page and already has a gear that opens `AdjustSheet`.
- History reads Supabase directly (paginated, filtered by type, no date filter). Today/date logs merge Supabase data with pending outbox ops (`withDayOps`), which is what makes offline logging feel instant.
- `components/ui/calendar.tsx` wraps react-day-picker (supports `modifiers`), and `wib.ts` already owns the WIB day boundary.
- Ledger rows: `prayer_ledger(prayer, entry_type, amount, logged_at)`, `fasting_ledger(entry_type, amount, fasted_on, logged_at)`.

## Goals / Non-Goals

**Goals:**
- One home route with no nav chrome; every other screen is a drill-down with a back arrow.
- A calendar whose dots are correct per WIB day and respond instantly to offline logs and undo.
- Reuse the History row and screen rather than build parallel ones.

**Non-Goals:**
- No new tables, RPCs or indexes. No change to history filters, entry detail, or the outbox.
- No streaks, counts or heatmap intensity on the calendar (a dot is boolean).

## Decisions

1. **Keep `/log` as the home route.** Remove the layout's navs and leave routes untouched; `/` still redirects to `/log`. Alternative: make the index route the home and delete `/log`. Rejected: churn in redirects, guards and the PWA start URL for no user-visible gain.

2. **Extract a shared `HistoryRow` component** from `history/index.tsx` and use it in both the History list and the day sheet. This is the reuse the request asked for, at the smallest seam. Alternative: embed the whole History screen in the sheet. Rejected: its filters and infinite scroll are wrong for a single day.

3. **History stays a route, opened by the `View history` button.** Alternative: render it inline under the calendar. Rejected: long scroll, and the infinite-scroll observer would trigger on the home page.

4. **One month query: `useMonthQadha(monthKey)`.** Fetch `entry_type = qadha` rows for the month's WIB range from both ledgers (selecting only the day-defining columns plus what the sheet row needs), and group into `Map<dayKey, entries>`. The day sheet reads from this map, so tapping a day costs no extra request. Prayer rows are bucketed by WIB day of `logged_at`; fasting rows by `fasted_on` when present (the day fasted), else WIB day of `logged_at`. Alternative: one query per tapped day. Rejected: two round trips per tap and no data for the dots anyway.

5. **Merge pending ops like the rest of the app.** Pending `insert` ops add qadha rows to their day; pending `undo` ops remove the latest entry of that prayer on that day from the map. The merge is a pure function next to `withDayOps`, so it can be unit tested. Query key `["month-qadha", monthKey]` is invalidated by the same places that invalidate `["history"]`, and the outbox sync's commit path.

6. **Dot via a react-day-picker modifier** (`modifiers={{ qadha: days }}`) styled in `calendar.tsx` as a small primary-colored dot under the day number; the day button stays a real `button`, with an accessible label noting "has qadha". Marked days are selectable; unmarked days do nothing (no selected state).

7. **Settings becomes a drill-down.** The home header gear is an icon link to `/settings` with an `aria-label`. "Adjust remaining" becomes a row in Settings that opens the existing `AdjustSheet` (lazy-loaded, fed by the same remaining queries). Back arrows on History and Settings go straight to `/log`, and the sub-pages go to their parent. Fixed targets, not `navigate(-1)`, so a deep link or PWA cold start never has an empty history stack.

8. **Visual polish via the `frontend-design` skill** during apply: calendar sizing for phone width, dot contrast in light and dark, header spacing, 44px touch targets, `View history` as a quiet secondary button so the primary action stays the prayer cards.

## Risks / Trade-offs

- [Dots wrong near midnight] -> Always bucket with the shared WIB helpers, never `toLocaleDateString`; unit test a 23:30 and a 00:30 WIB case.
- [Month query offline shows nothing for past months] -> Cache the current month like other home queries; accept that browsing uncached months offline shows an empty calendar plus pending ops. Revisit if it bites.
- [Pending undo targets a row the map does not hold] -> Undo only removes a mark when the map's entry count for that day reaches zero; otherwise the server value wins after sync.
- [Conflict with `faster-qadha-logging` in `log.tsx`/`PrayerCard`] -> Land that change first; this change only touches the header and appends a section to `log.tsx`.
- [Removing the sidebar on desktop] -> Acceptable: the app is phone-first; content stays centered in `max-w-lg`.
