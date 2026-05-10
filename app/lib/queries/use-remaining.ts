import { useQuery } from "@tanstack/react-query"
import { supabase } from "~/lib/supabase"

export const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const
export type Prayer = (typeof PRAYERS)[number]

export interface PrayerRemaining {
  prayer: Prayer
  remaining: number
  displayRemaining: number
}

export function usePrayerRemaining() {
  return useQuery({
    queryKey: ["prayer-remaining"],
    queryFn: async (): Promise<PrayerRemaining[]> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

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

      return PRAYERS.map((prayer) => {
        const remaining = sums[prayer] ?? 0
        return { prayer, remaining, displayRemaining: Math.max(0, remaining) }
      })
    },
  })
}

function wibDateStr(): string {
  const WIB_OFFSET = 7 * 60 * 60 * 1000
  const wib = new Date(Date.now() + WIB_OFFSET)
  return wib.toISOString().slice(0, 10)
}

export function useTodayPrayerLog() {
  const dateKey = wibDateStr()
  return useQuery({
    queryKey: ["prayer-today", dateKey],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const start = new Date(`${dateKey}T00:00:00+07:00`)
      const end = new Date(`${dateKey}T23:59:59.999+07:00`)
      const { data, error } = await supabase
        .from("prayer_ledger")
        .select("prayer")
        .eq("user_id", session.user.id)
        .eq("entry_type", "qadha")
        .gte("logged_at", start.toISOString())
        .lte("logged_at", end.toISOString())
      if (error) throw error
      return new Set((data ?? []).map((r: { prayer: string }) => r.prayer as Prayer))
    },
  })
}

export function useFastingRemaining() {
  return useQuery({
    queryKey: ["fasting-remaining"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("fasting_ledger")
        .select("amount")
        .eq("user_id", session.user.id)
      if (error) throw error

      const total = (data ?? []).reduce(
        (s, r: { amount: number }) => s + Number(r.amount ?? 0),
        0
      )
      return { remaining: total, displayRemaining: Math.max(0, total) }
    },
  })
}
