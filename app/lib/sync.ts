import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabase, readStoredSession } from "./supabase"
import { queryClient } from "./query-client"
import { getOps, patchOp, removeOp, setSending, type Op } from "./outbox"
import { commitSyncedOp } from "./queries/use-remaining"
import { wibDayRange } from "./wib"

// Drains the outbox to Supabase, oldest first. Anything that isn't a definite rejection of the data
// (offline, timeout, paused/cold project, expired session) keeps the op and retries with backoff,
// so logs made while Supabase is unreachable sync whenever it comes back.

const REQUEST_TIMEOUT_MS = 20_000
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000]

let running = false
let rerun = false
let attempt = 0
let retryTimer: ReturnType<typeof setTimeout> | undefined

function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out")), REQUEST_TIMEOUT_MS)
    ),
  ])
}

// Postgres class 22 (data exception) / 23 (constraint violation): resending can never succeed.
function isRejected(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code
  return typeof code === "string" && /^2[23]/.test(code)
}

// Returns whether the op changed anything server-side (an undo may find nothing to delete).
async function send(supabase: SupabaseClient, op: Op): Promise<boolean> {
  if (op.kind === "insert") {
    const { error } = await supabase
      .from(op.table)
      .insert(op.rows)
      .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS))
    // 23505 on our client-generated id: an earlier attempt landed but its response was lost.
    if (error && error.code !== "23505") throw error
    return true
  }

  let targetId = op.targetId
  if (targetId === undefined) {
    const { start, end } = wibDayRange(op.dateKey)
    const { data, error } = await supabase
      .from("prayer_ledger")
      .select("id")
      .eq("user_id", op.uid)
      .eq("prayer", op.prayer)
      .eq("entry_type", "qadha")
      .gte("logged_at", start)
      .lte("logged_at", end)
      .order("logged_at", { ascending: false })
      .limit(1)
      .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS))
    if (error) throw error
    targetId = (data?.[0]?.id as string | undefined) ?? null
    patchOp(op.id, { targetId })
  }
  if (targetId === null) return false

  const { error } = await supabase
    .from("prayer_ledger")
    .delete()
    .eq("id", targetId)
    .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS))
  if (error) throw error
  return true
}

async function drain() {
  const uid = readStoredSession()?.user.id
  const next = () => getOps().find((op) => op.uid === uid)
  if (!uid || !next()) return

  const supabase = await withTimeout(getSupabase())
  // Refreshes the access token if needed; fails (and retries later) while Supabase is unreachable.
  const { data, error } = await withTimeout(supabase.auth.getSession())
  if (error) throw error
  if (data.session?.user.id !== uid) throw new Error("Session not ready")

  let synced = false
  try {
    for (let op = next(); op; op = next()) {
      setSending(op.id)
      try {
        const applied = await withTimeout(send(supabase, op))
        await commitSyncedOp(op, applied)
      } catch (err) {
        if (!isRejected(err)) throw err
        console.error("Server rejected a queued log; dropping it", op, err)
        removeOp(op.id)
        import("sonner").then(({ toast }) => toast.error("A log couldn't be saved: the server rejected it."))
      } finally {
        setSending(null)
      }
      synced = true
    }
  } finally {
    if (synced) {
      for (const key of ["prayer-remaining", "fasting-remaining", "prayer-today", "prayer-date", "history"]) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    }
  }
}

export function flushOutbox() {
  if (running) {
    rerun = true
    return
  }
  running = true
  clearTimeout(retryTimer)

  // Web Locks keep two open tabs from sending the same queue at once.
  const run = () => drain()
  const task = navigator.locks ? navigator.locks.request("qadha-outbox", run) : run()

  task
    .then(
      () => {
        attempt = 0
      },
      (err) => {
        console.warn("Outbox sync failed; will retry", err)
        const delay = RETRY_DELAYS_MS[Math.min(attempt++, RETRY_DELAYS_MS.length - 1)]
        retryTimer = setTimeout(flushOutbox, delay)
      }
    )
    .finally(() => {
      running = false
      if (rerun) {
        rerun = false
        flushOutbox()
      }
    })
}

let started = false

export function startOutboxSync() {
  if (started) return
  started = true
  window.addEventListener("online", flushOutbox)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushOutbox()
  })
  flushOutbox()
}
