import type { Prayer, PrayerRemaining } from "~/lib/queries/use-remaining"

// Hide a prayer once it is paid off, unless it was logged today (keeps the row's undo usable).
// While counts are loading (rows undefined) nothing is hidden.
export function visiblePrayers(
  all: readonly Prayer[],
  rows: PrayerRemaining[] | undefined,
  loggedToday: Set<Prayer>
): Prayer[] {
  return all.filter((p) => {
    const row = rows?.find((r) => r.prayer === p)
    return !row || row.displayRemaining > 0 || loggedToday.has(p)
  })
}
