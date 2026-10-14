# Tasks

## 1. Hide paid-off rows

- [x] 1.1 In `app/routes/_app/log.tsx`, filter `PRAYERS` so a prayer is hidden only when its loaded `displayRemaining` is 0 and it is not in `todayDone`; verify by running the app: a paid-off prayer is hidden and loading shows all five
- [x] 1.2 Add `log.allPrayersPaidOff` to `en.json` and `id.json` and render it when no row remains; verify the message shows with all five at 0 and `Log by day` is still present
- [x] 1.3 Extract the filter as a small pure function (e.g. in `app/lib/`) with a unit test covering: loading, paid off, logged today, negative remaining; verify `npm test` passes

## 2. Integration check

- [x] 2.1 Manually log the last qadha of one prayer, confirm the row stays with working undo, and that undo restores the count; run `npm test` and the typecheck
