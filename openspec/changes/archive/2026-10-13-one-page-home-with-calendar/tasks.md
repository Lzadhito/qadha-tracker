# Tasks

## 1. Month data

- [x] 1.1 Add a pure `mergePendingQadha(entries, ops)` plus WIB day bucketing (prayer by `logged_at`, fasting by `fasted_on` else `logged_at`) in `app/lib/`, with unit tests for the 23:30/00:30 WIB boundary, miss/adjustment exclusion, pending insert and pending undo; verify with the project's test command
- [x] 1.2 Add `useMonthQadha(monthKey)` in `app/lib/queries/` fetching both ledgers for the month's WIB range, returning a day-keyed map merged with pending ops; invalidate it where `["history"]` is invalidated and on outbox sync commit; verify offline log shows a mark and Undo removes it

## 2. Shared row and calendar UI

- [x] 2.1 Extract `HistoryRow` from `history/index.tsx` and use it there; verify the History screen renders and links exactly as before
- [x] 2.2 Add a `qadha` day modifier (dot) to `components/ui/calendar.tsx`, styled for light and dark, with an accessible "has qadha" label; verify visually at phone width in both themes
- [x] 2.3 Create `QadhaCalendar` (month nav, dots from `useMonthQadha`, tap marked day opens sheet, unmarked days inert) and `DayEntriesSheet` (date title, `HistoryRow` list, row opens `/history/:id`), lazy-loaded like the other sheets; verify the Day entries scenarios in `specs/qadha-calendar/spec.md` by hand
- [x] 2.4 Add the `View history` button under the calendar linking to `/history`; verify it opens History and back returns home
- [x] 2.5 Add i18n strings (en, id) for calendar, sheet, button and labels; verify no missing-key warnings in either locale

## 3. One-page shell

- [x] 3.1 Remove the sidebar and bottom nav from `_app/layout.tsx` (and the `pb-20` padding); verify no nav on phone and desktop widths
- [x] 3.2 Replace the home header gear with a Settings icon link (`aria-label`), and render `QadhaCalendar` below the fasting card in `log.tsx`; verify exactly one gear, and the calendar sits below fasting
- [x] 3.3 Move "Adjust remaining" into `settings/index.tsx` as a row opening `AdjustSheet` (remove it and its state from `log.tsx`); verify saving an adjustment updates counts and appears in history, and the control is gone from home
- [x] 3.4 Add a back control (`navigate(-1)`, fallback `/log`) to History, Settings, Data and About, and drop the now-unused `nav.*` keys and `navItems`; verify back from a cold deep link lands on home and no dead strings remain

## 4. Polish and integration

- [x] 4.1 Apply the `frontend-design` skill pass on the new sections (spacing, touch targets, dot contrast, header, secondary History button); verify on a phone-width viewport in light and dark
- [x] 4.2 Walk the proposal's flows end to end online and offline (log, dot appears, tap day, open entry, delete, back; View history; Settings, Adjust remaining), then run the project's build, typecheck and tests; verify all pass
