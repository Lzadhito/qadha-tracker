import type { Op } from "./outbox"
import type { Prayer } from "./queries/use-remaining"
import { wibDateKey } from "./wib"

// One qadha shown on the calendar. `day` is the WIB day it counts for.
export interface QadhaEntry {
  id: string
  obligation: "prayer" | "fasting"
  prayer?: Prayer
  entry_type: "qadha"
  amount: number
  logged_at: string
  day: string
}

// Prayers count on the day they were logged; a fast counts on the day fasted when that is known.
export function qadhaDay(loggedAt: string, fastedOn?: string | null): string {
  return fastedOn ?? wibDateKey(new Date(loggedAt))
}

// Overlays the outbox on server rows, like withDayOps does for a single day. Only qadha counts:
// misses and adjustments never become entries.
export function mergePendingQadha(entries: QadhaEntry[], ops: Op[], monthKey: string): QadhaEntry[] {
  let next = entries
  for (const op of ops) {
    if (op.kind === "insert") {
      const known = new Set(next.map((e) => e.id))
      const added = op.rows
        .filter((r) => r.entry_type === "qadha" && !known.has(r.id))
        .map((r) => ({
          id: r.id,
          obligation: op.table === "prayer_ledger" ? ("prayer" as const) : ("fasting" as const),
          prayer: r.prayer,
          entry_type: "qadha" as const,
          amount: r.amount,
          logged_at: r.logged_at,
          day: qadhaDay(r.logged_at),
        }))
        .filter((e) => e.day.startsWith(monthKey))
      next = [...next, ...added]
    } else if (op.targetId !== null) {
      // Undo removes the latest matching qadha of that prayer on that day.
      const latest = next
        .filter((e) => e.obligation === "prayer" && e.prayer === op.prayer && e.day === op.dateKey)
        .sort((a, b) => b.logged_at.localeCompare(a.logged_at))[0]
      if (latest) next = next.filter((e) => e !== latest)
    }
  }
  return next
}

export function groupByDay(entries: QadhaEntry[]): Map<string, QadhaEntry[]> {
  const days = new Map<string, QadhaEntry[]>()
  for (const e of entries) days.set(e.day, [...(days.get(e.day) ?? []), e])
  for (const list of days.values()) list.sort((a, b) => b.logged_at.localeCompare(a.logged_at))
  return days
}

// How many qadha were done per day. Amounts are stored negative (-1 per qadha), so use the size.
export function countByDay(days: Map<string, QadhaEntry[]>): Map<string, number> {
  return new Map([...days].map(([day, list]) => [day, list.reduce((n, e) => n + Math.abs(e.amount), 0)]))
}
