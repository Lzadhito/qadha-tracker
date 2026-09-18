import { readStoredSession } from "./supabase"
import { cancelUnsentQadha, enqueue, type LedgerRow, type LedgerTable } from "./outbox"
import { flushOutbox } from "./sync"
import { PRAYERS, getRemainingPrayers, type Prayer } from "./queries/use-remaining"
import { wibDateKey } from "./wib"

// Every log action is synchronous and local: it lands in the outbox (shown immediately) and the
// sync pushes it to Supabase in the background. Nothing here waits on the network.

type NewRow = Omit<LedgerRow, "id" | "user_id">

function currentUid(): string {
  const uid = readStoredSession()?.user.id
  if (!uid) throw new Error("Not signed in")
  return uid
}

function record(table: LedgerTable, rows: NewRow[]) {
  if (rows.length === 0) return
  const uid = currentUid()
  enqueue({
    id: crypto.randomUUID(),
    uid,
    kind: "insert",
    table,
    rows: rows.map((row) => ({ id: crypto.randomUUID(), user_id: uid, ...row })),
  })
  flushOutbox()
}

// logged_at is stamped now, not by the server, since the sync may run much later.
const now = () => new Date().toISOString()

function qadhaRows(prayers: readonly Prayer[], loggedDates?: string[]): NewRow[] {
  return (loggedDates ?? [now()]).flatMap((logged_at) =>
    prayers.map((prayer) => ({ prayer, entry_type: "qadha" as const, amount: -1, logged_at }))
  )
}

export function logPrayer(prayer: Prayer, loggedDates?: string[]) {
  record("prayer_ledger", qadhaRows([prayer], loggedDates))
}

export function logFullDay(loggedDates?: string[]) {
  record("prayer_ledger", qadhaRows(PRAYERS, loggedDates))
}

export function logRemainingToday(exclude: Set<Prayer>, loggedDates?: string[]) {
  record("prayer_ledger", qadhaRows(getRemainingPrayers(exclude), loggedDates))
}

export function undoTodayPrayer(prayer: Prayer) {
  const uid = currentUid()
  const dateKey = wibDateKey()
  if (cancelUnsentQadha(uid, prayer, dateKey)) return
  enqueue({ id: crypto.randomUUID(), uid, kind: "undo", prayer, dateKey })
  flushOutbox()
}

export function logFasting(loggedAt?: string) {
  record("fasting_ledger", [{ entry_type: "qadha", amount: -1, logged_at: loggedAt ?? now() }])
}

export function adjustPrayers(adjustments: Array<{ prayer: Prayer; delta: number }>) {
  record(
    "prayer_ledger",
    adjustments
      .filter((a) => a.delta !== 0)
      .map((a) => ({ prayer: a.prayer, entry_type: "adjustment" as const, amount: a.delta, logged_at: now() }))
  )
}

export function adjustFasting(delta: number) {
  if (delta === 0) return
  record("fasting_ledger", [{ entry_type: "adjustment", amount: delta, logged_at: now() }])
}
