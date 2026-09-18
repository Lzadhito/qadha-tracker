import { useMemo, useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSupabase, readStoredSession } from "~/lib/supabase"
import { queryClient } from "~/lib/query-client"
import {
  applyToDaySet,
  fastingDelta,
  getOps,
  getServerOps,
  prayerDeltas,
  removeOp,
  subscribe,
  type Op,
} from "~/lib/outbox"
import { wibDateKey, wibDayRange } from "~/lib/wib"

export const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const
export type Prayer = (typeof PRAYERS)[number]

// Server data here only ever reflects synced rows; the hooks below overlay the outbox's pending
// ops on top, so a log shows up instantly and survives a reload even while Supabase is down.

// ponytail: last-known server data for the log screen, seeded as initialData (updatedAt 0 = stale,
// so it refetches on mount). Per-user clearing lives in signOut().
const cacheKey = (key: string) => `qadha:cache:${key}`

function cachedData<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(key))
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify(value))
  } catch {
    // quota or private mode: cache is best-effort
  }
}

export function clearCachedRemaining() {
  localStorage.removeItem(cacheKey("prayer-remaining"))
  localStorage.removeItem(cacheKey("fasting-remaining"))
  localStorage.removeItem(cacheKey("prayer-today"))
}

export function getRemainingPrayers(done: Set<Prayer>): Prayer[] {
  return PRAYERS.filter((p) => !done.has(p))
}

export function wibDateStr(): string {
  return wibDateKey()
}

export interface PrayerRemaining {
  prayer: Prayer
  remaining: number
  displayRemaining: number
}

interface FastingRemaining {
  remaining: number
  displayRemaining: number
}

async function requireSession() {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Not authenticated")
  return { supabase, session }
}

function usePendingOps(): Op[] {
  const ops = useSyncExternalStore(subscribe, getOps, getServerOps)
  const uid = readStoredSession()?.user.id
  return useMemo(() => ops.filter((op) => op.uid === uid), [ops, uid])
}

export function usePendingCount(): number {
  return usePendingOps().length
}

// ─── Merging (pure, shared with the sync ack below) ──────────────────────────

function withPrayerOps(rows: PrayerRemaining[], ops: Op[]): PrayerRemaining[] {
  if (!ops.length) return rows
  const totals: Partial<Record<Prayer, number>> = {}
  for (const op of ops) {
    for (const [prayer, delta] of Object.entries(prayerDeltas(op)) as [Prayer, number][]) {
      totals[prayer] = (totals[prayer] ?? 0) + delta
    }
  }
  return rows.map((r) => {
    const remaining = r.remaining + (totals[r.prayer] ?? 0)
    return { prayer: r.prayer, remaining, displayRemaining: Math.max(0, remaining) }
  })
}

function withFastingOps(data: FastingRemaining, ops: Op[]): FastingRemaining {
  const remaining = ops.reduce((sum, op) => sum + fastingDelta(op), data.remaining)
  return { remaining, displayRemaining: Math.max(0, remaining) }
}

function withDayOps(done: Set<Prayer>, ops: Op[], dateKey: string): Set<Prayer> {
  if (!ops.length) return done
  const next = new Set(done)
  for (const op of ops) applyToDaySet(next, op, dateKey)
  return next
}

// Called by the sync once an op is confirmed by the server: fold it into the cached server data
// and drop it from the outbox in the same tick, so the displayed numbers never flicker.
export async function commitSyncedOp(op: Op, applied: boolean) {
  const todayKey = wibDateKey()
  // A fetch that started before this write landed would overwrite the patch with stale data.
  await Promise.all(
    ["prayer-remaining", "fasting-remaining", "prayer-today"].map((key) =>
      queryClient.cancelQueries({ queryKey: [key] })
    )
  )
  if (applied) {
    const prayers = queryClient.getQueryData<PrayerRemaining[]>(["prayer-remaining"])
    if (prayers) {
      const next = withPrayerOps(prayers, [op])
      queryClient.setQueryData(["prayer-remaining"], next)
      writeCache("prayer-remaining", next)
    }
    const fasting = queryClient.getQueryData<FastingRemaining>(["fasting-remaining"])
    if (fasting) {
      const next = withFastingOps(fasting, [op])
      queryClient.setQueryData(["fasting-remaining"], next)
      writeCache("fasting-remaining", next)
    }
    const today = queryClient.getQueryData<Set<Prayer>>(["prayer-today", todayKey])
    if (today) {
      const next = withDayOps(today, [op], todayKey)
      queryClient.setQueryData(["prayer-today", todayKey], next)
      writeCache("prayer-today", { dateKey: todayKey, prayers: [...next] })
    }
  }
  removeOp(op.id)
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePrayerRemaining() {
  const query = useQuery({
    queryKey: ["prayer-remaining"],
    initialData: () => cachedData<PrayerRemaining[]>("prayer-remaining"),
    initialDataUpdatedAt: 0,
    queryFn: async (): Promise<PrayerRemaining[]> => {
      const { supabase, session } = await requireSession()

      const { data, error } = await supabase
        .from("prayer_ledger")
        .select("prayer, amount")
        .eq("user_id", session.user.id)
      if (error) throw error

      const sums: Record<string, number> = {}
      for (const row of (data ?? []) as { prayer: string; amount: number }[]) {
        const amt = Number(row.amount ?? 0)
        sums[row.prayer] = (sums[row.prayer] ?? 0) + amt
      }

      const result = PRAYERS.map((prayer) => {
        const remaining = sums[prayer] ?? 0
        return { prayer, remaining, displayRemaining: Math.max(0, remaining) }
      })
      writeCache("prayer-remaining", result)
      return result
    },
  })
  const pending = usePendingOps()
  const data = useMemo(() => query.data && withPrayerOps(query.data, pending), [query.data, pending])
  return { data, isLoading: query.isLoading }
}

async function fetchDayLog(dateKey: string): Promise<Prayer[]> {
  const { supabase, session } = await requireSession()
  const { start, end } = wibDayRange(dateKey)
  const { data, error } = await supabase
    .from("prayer_ledger")
    .select("prayer")
    .eq("user_id", session.user.id)
    .eq("entry_type", "qadha")
    .gte("logged_at", start)
    .lte("logged_at", end)
  if (error) throw error
  return (data ?? []).map((r: { prayer: string }) => r.prayer as Prayer)
}

export function useTodayPrayerLog() {
  const dateKey = wibDateStr()
  const query = useQuery({
    queryKey: ["prayer-today", dateKey],
    initialData: () => {
      const cached = cachedData<{ dateKey: string; prayers: Prayer[] }>("prayer-today")
      return cached?.dateKey === dateKey ? new Set(cached.prayers) : undefined
    },
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const prayers = await fetchDayLog(dateKey)
      writeCache("prayer-today", { dateKey, prayers })
      return new Set(prayers)
    },
  })
  const pending = usePendingOps()
  // Pending logs count even before the server answers, so "logged today" is instant.
  const data = useMemo(
    () => withDayOps(query.data ?? new Set(), pending, dateKey),
    [query.data, pending, dateKey]
  )
  return { data }
}

export function useDatePrayerLog(dateKey: string | null) {
  const query = useQuery({
    queryKey: ["prayer-date", dateKey],
    enabled: !!dateKey,
    queryFn: async () => new Set(await fetchDayLog(dateKey!)),
  })
  const pending = usePendingOps()
  const data = useMemo(
    () => (query.data && dateKey ? withDayOps(query.data, pending, dateKey) : query.data),
    [query.data, pending, dateKey]
  )
  return { data, isLoading: query.isLoading }
}

export function resolveExclude({
  rangeFrom,
  rangeTo,
  todayKey,
  todayDone,
  fetchedDone,
}: {
  rangeFrom: Date | undefined
  rangeTo: Date | undefined
  todayKey: string
  todayDone: Set<Prayer>
  fetchedDone: Set<Prayer> | undefined
}): Set<Prayer> {
  if (!rangeFrom) return todayDone
  const isSingle = !rangeTo || (
    rangeFrom.getFullYear() === rangeTo.getFullYear() &&
    rangeFrom.getMonth() === rangeTo.getMonth() &&
    rangeFrom.getDate() === rangeTo.getDate()
  )
  if (!isSingle) return new Set()
  const dateKey = `${rangeFrom.getFullYear()}-${String(rangeFrom.getMonth() + 1).padStart(2, "0")}-${String(rangeFrom.getDate()).padStart(2, "0")}`
  if (dateKey === todayKey) return todayDone
  return fetchedDone ?? new Set()
}

export function useFastingRemaining() {
  const query = useQuery({
    queryKey: ["fasting-remaining"],
    initialData: () => cachedData<FastingRemaining>("fasting-remaining"),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const { supabase, session } = await requireSession()

      const { data, error } = await supabase
        .from("fasting_ledger")
        .select("amount")
        .eq("user_id", session.user.id)
      if (error) throw error

      const total = (data ?? []).reduce(
        (s, r: { amount: number }) => s + Number(r.amount ?? 0),
        0
      )
      const result = { remaining: total, displayRemaining: Math.max(0, total) }
      writeCache("fasting-remaining", result)
      return result
    },
  })
  const pending = usePendingOps()
  const data = useMemo(() => query.data && withFastingOps(query.data, pending), [query.data, pending])
  return { data, isLoading: query.isLoading }
}
