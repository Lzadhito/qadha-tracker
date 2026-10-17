import type { Prayer } from "./queries/use-remaining"
import { wibDateKey } from "./wib"

// Local-first log writes. Every log lands here (localStorage) synchronously, the UI shows server
// data + pending ops, and sync.ts drains the queue in order whenever Supabase is reachable. Ops
// carry client-generated row ids, so re-sending after a lost response can't double-insert.

export type LedgerTable = "prayer_ledger" | "fasting_ledger"

export interface LedgerRow {
  id: string
  user_id: string
  prayer?: Prayer
  // The daily prayer this qadha was done with. Left out (not null) when unknown, so an app
  // talking to a database without the column still works for unanchored logs.
  anchor?: Prayer
  entry_type: "qadha" | "adjustment"
  amount: number
  logged_at: string
}

// One qadha on a given day, as the log screen needs it. `anchor` is null for old/unanchored logs.
export interface DayEntry {
  prayer: Prayer
  anchor: Prayer | null
}

export type Op =
  | { id: string; uid: string; kind: "insert"; table: LedgerTable; rows: LedgerRow[] }
  // Undo the latest qadha of `prayer` logged on `dateKey`. The row may come from another device,
  // so it is looked up at sync time; `targetId` stores the result so a retried delete stays
  // idempotent (null = nothing to undo).
  | { id: string; uid: string; kind: "undo"; prayer: Prayer; dateKey: string; targetId?: string | null }

const KEY = "qadha:outbox"
const EMPTY: Op[] = []

let ops: Op[] | undefined
let sendingId: string | null = null
const listeners = new Set<() => void>()

function read(): Op[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Op[]) : EMPTY
  } catch {
    return EMPTY
  }
}

function notify() {
  listeners.forEach((l) => l())
}

// Mutations start from storage, not the in-memory copy, so another tab's writes aren't clobbered.
function update(fn: (current: Op[]) => Op[]) {
  ops = fn(read())
  try {
    localStorage.setItem(KEY, JSON.stringify(ops))
  } catch {
    // quota/private mode: the op still lives in memory for this session
  }
  notify()
}

export function getOps(): Op[] {
  ops ??= read()
  return ops
}

export function getServerOps(): Op[] {
  return EMPTY
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return
    ops = read()
    notify()
  })
}

export function enqueue(op: Op) {
  update((current) => [...current, op])
}

export function patchOp(id: string, patch: { targetId: string | null }) {
  update((current) => current.map((o) => (o.id === id ? { ...o, ...patch } : o)))
}

export function removeOp(id: string) {
  update((current) => current.filter((o) => o.id !== id))
}

export function setSending(id: string | null) {
  sendingId = id
}

const isTodayQadha = (row: LedgerRow, prayer: Prayer, dateKey: string) =>
  row.prayer === prayer && row.entry_type === "qadha" && wibDateKey(new Date(row.logged_at)) === dateKey

// Undo of a log that never reached the server: drop it locally instead of queueing a delete.
// Returns false when there is no such unsent log (it's synced, or being sent right now).
export function cancelUnsentQadha(uid: string, prayer: Prayer, dateKey: string): boolean {
  const current = read()
  for (let i = current.length - 1; i >= 0; i--) {
    const op = current[i]
    if (op.kind !== "insert" || op.table !== "prayer_ledger" || op.uid !== uid || op.id === sendingId) continue
    let rowIndex = op.rows.length - 1
    while (rowIndex >= 0 && !isTodayQadha(op.rows[rowIndex], prayer, dateKey)) rowIndex--
    if (rowIndex < 0) continue
    const rows = op.rows.filter((_, j) => j !== rowIndex)
    update((latest) =>
      rows.length
        ? latest.map((o) => (o.id === op.id ? { ...op, rows } : o))
        : latest.filter((o) => o.id !== op.id)
    )
    return true
  }
  return false
}

// ─── Effects of an op on the numbers the log screen shows ────────────────────

export function prayerDeltas(op: Op): Partial<Record<Prayer, number>> {
  const deltas: Partial<Record<Prayer, number>> = {}
  if (op.kind === "undo") {
    if (op.targetId !== null) deltas[op.prayer] = 1
    return deltas
  }
  if (op.table !== "prayer_ledger") return deltas
  for (const row of op.rows) {
    if (row.prayer) deltas[row.prayer] = (deltas[row.prayer] ?? 0) + row.amount
  }
  return deltas
}

export function fastingDelta(op: Op): number {
  if (op.kind !== "insert" || op.table !== "fasting_ledger") return 0
  return op.rows.reduce((sum, row) => sum + row.amount, 0)
}

// Applies an op to the qadha already logged on `dateKey` (oldest first, like the server list).
export function applyToDayLog(done: DayEntry[], op: Op, dateKey: string) {
  if (op.kind === "undo") {
    if (op.dateKey !== dateKey || op.targetId === null) return
    const last = done.map((e) => e.prayer).lastIndexOf(op.prayer)
    if (last >= 0) done.splice(last, 1)
    return
  }
  if (op.table !== "prayer_ledger") return
  for (const row of op.rows) {
    if (row.prayer && isTodayQadha(row, row.prayer, dateKey)) done.push({ prayer: row.prayer, anchor: row.anchor ?? null })
  }
}
