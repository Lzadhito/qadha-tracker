# Proposal

## Why

The app is three tabs (Log, History, Settings) behind a bottom nav, but the daily job is one thing: log a qadha and glance at progress. History is a separate trip, and there is no way to see *which days* you made up prayers. A single home page with a month calendar answers "when did I do qadha?" at a glance and removes the navigation chrome.

## What Changes

- Remove the mobile bottom nav and the desktop sidebar. The app becomes one home page plus a few drill-down screens, each with a back arrow.
- Home header gets a Settings gear (top right) linking to `/settings`. Settings keeps its Data and About sub-pages.
- The existing "Adjust remaining" gear on the home header moves into Settings as a row that opens the same adjust sheet.
- Below the fasting card, the home page shows a month calendar. Days with at least one qadha (prayer or fasting) carry a dot; the month can be changed.
- Tapping a day with a dot opens a bottom sheet listing that day's qadha entries, reusing the history row; a row opens the existing entry detail.
- A `View history` button under the calendar opens the existing `/history` screen (reused as-is, now with a back arrow to home).
- Entry detail and delete behavior are unchanged.

## Capabilities

### New Capabilities
- `home-navigation`: the one-page app shell: no tab navigation, Settings reachable from the home header, drill-down screens return to home, and "Adjust remaining" lives under Settings.
- `qadha-calendar`: the home month calendar showing which days have qadha, the per-day entry list, and the entry point to full history.

### Modified Capabilities

(none; `openspec/specs/` is empty. The in-flight `faster-qadha-logging` change introduces `qadha-logging`, which this change does not alter.)

## Impact

- UI: `app/routes/_app/layout.tsx` (drop navs), `app/routes/_app/log.tsx` (header gear, calendar section), `app/routes/_app/settings/index.tsx` (adjust row, back arrow), `app/routes/_app/history/index.tsx` and settings sub-pages (back arrow), new calendar section and day sheet components, `app/components/ui/calendar.tsx` (dot modifier), i18n strings in `app/lib/i18n/locales/{en,id}.json`.
- Data: one new read query for a month of qadha entries from `prayer_ledger` and `fasting_ledger`; merged with pending outbox ops. No schema change, no migration, no new dependency.
- Sequencing: `faster-qadha-logging` also edits `log.tsx` and `PrayerCard`; land it first or rebase this over it.
- Out of scope: changing history filters, new stats or streaks, editing entries from the day sheet, theming overhaul beyond the polish of the new sections.
