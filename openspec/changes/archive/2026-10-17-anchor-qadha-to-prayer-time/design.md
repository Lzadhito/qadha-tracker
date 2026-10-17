# Design

## Context

A qadha is one `prayer_ledger` row (`prayer`, `amount -1`, `logged_at`). Logs go through a local outbox (`app/lib/outbox.ts`) and sync later; the UI shows server data plus pending ops. "Logged on a day" is a `Set<Prayer>` built by `fetchDayLog`, `applyToDaySet` and `withDayOps`, so it cannot hold two logs of one prayer or say which daily prayer a log belongs to. Undo removes the latest qadha of a prayer on a day (`undoTodayPrayer` / `cancelUnsentQadha`). See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Anchor is saved data, reaches the server, and survives offline.
- One prayer can be logged several times a day, once per anchor, with no extra taps for the common case.

**Non-Goals:**
- Real prayer times, location, or notifications. The clock rule is a rough guess the user can override.
- Changing the anchor of an old entry, or inferring anchors for old rows.
- Blocking two logs with the same (prayer, anchor, day). Allowed, like today.

## Decisions

**1. A nullable `anchor` column, not a time hidden in `logged_at`.**
Same five ids as `prayer` (`subuh|zuhur|asar|maghrib|isya`), with a check constraint. Nullable keeps old rows and unanchored logs valid and the migration cheap (no rewrite, no lock). Alternative: encode the anchor as a fixed clock time in `logged_at`; rejected because real and fake times become indistinguishable and the WIB day logic stays fragile.

**2. Selector is a sticky mode that follows the clock.**
Pure function `anchorForClock(date)` maps local time to a slot (rough bounds, constants in one place). A manual pick is stored in `localStorage` with the slot it was made in; it is used only while the clock is still in that slot. This removes the usual mode error (forgetting to switch) without a timer. Alternative: per-card chips; rejected in discussion (up to 25 chips, a choice on every tap).

**3. Day set becomes a list of (prayer, anchor) entries.**
`fetchDayLog` also selects `anchor`; `applyToDaySet` / `withDayOps` work on entries, and helpers derive what the UI needs: count per prayer (card), set of `prayer+anchor` keys (grid disabled cells). Rows with a null anchor count toward the card count and fill no grid cell. Alternative: a parallel count map next to the existing Set; rejected because it would drift from the entries.

**4. Per-prayer date sheet stays unanchored, except `Today`.**
Past days and ranges there log with no anchor; the day grid is the anchored backfill path. `Today` is "now", so it uses the selected anchor.

**5. Undo is unchanged.**
It still removes the latest qadha of that prayer for the day, which right after a tap is the one just logged.

## Risks / Trade-offs

- **New app against a database without the column** → inserts fail with a non-constraint error, which the outbox retries rather than drops, so no log is lost; but reads that select `anchor` (today's log, history, calendar) error until the column exists. Apply the migration before, or right after, deploying.
- **Wrong anchor after forgetting to switch** → clock default plus expiry of manual picks, and the toast names the anchor so a mistake is seen at once.
- **Grid can't tell old unanchored logs apart** → null-anchor rows never fill a cell; a user may re-log a day they logged before. Accepted for a transition.
- **Clock slots are a guess** (late prayers, travel) → only a default; one tap overrides.

## Migration Plan

1. Apply `07_*.sql` (add nullable `anchor`, check constraint) to Supabase; mirror in `db/schema.ts` following how earlier migrations were authored.
2. Deploy the app. Rollback: ship the previous app; the extra column is harmless.

## Open Questions

- Exact clock bounds for the five slots; tune after a few days of use.
