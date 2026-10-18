## 1. Remove the selector

- [x] 1.1 Remove `AnchorSelector` and `useAnchor` from `app/routes/_app/log.tsx`; delete `app/components/prayer/AnchorSelector.tsx`
- [x] 1.2 Cut `app/lib/anchor.ts` down to `anchorForClock`; update `anchor.test.ts` to match
- [x] 1.3 `PrayerCard`: drop the `anchor` prop and compute `anchorForClock(new Date())` in `logNow`

## 2. Per-prayer day sheet

- [x] 2.1 Add an optional `prayer` prop to `DayLogSheet`: render only that row, with a title naming the prayer
- [x] 2.2 In `log.tsx`, open `DayLogSheet` with the tapped prayer from the card's calendar icon; `Log by day` still opens it with no prayer
- [x] 2.3 Reset the chosen prayer when the sheet closes
- [x] 2.4 Delete `PrayerLogSheet.tsx` and its lazy import

## 3. Copy and checks

- [x] 3.1 Remove unused `anchor.*` and old date-sheet strings from `en.json` and `id.json`; add the single-prayer sheet title
- [x] 3.2 Run `tsc` and the tests; open the app and check: no selector, `+Qadha` toast, calendar icon sheet shows one prayer, save logs the ticked cells
