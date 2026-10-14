# Proposal

## Why

Once a prayer's qadha is fully paid off, its row on the log screen still shows "All paid off" and a +Qadha button. Finished rows add noise and push the calendar down, while the user only needs to see what is still owed.

## What Changes

- On the home log screen, hide a prayer row when its remaining count is 0 (or below) and it was not logged today.
- A row that was logged today stays visible, so its "logged today" mark and undo control remain usable until the day ends.
- While the remaining count is still loading, never hide the row.
- When all five prayer rows are hidden, show a short "all prayers paid off" message in their place.
- Out of scope: the fasting card keeps its current "done" state; no data or sync changes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `qadha-logging`: adds a requirement that the prayer list hides paid-off prayers (with the logged-today exception and an all-done message).

## Impact

- `app/routes/_app/log.tsx`: filter the prayer list and render the all-done message.
- `app/lib/i18n/locales/en.json`, `id.json`: one new string.
- No database, API, outbox or dependency changes.
- Assumption: paid-off prayers can still be logged through `Log by day`, which lists all five prayers.
