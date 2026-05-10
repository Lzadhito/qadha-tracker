import { useQuery } from "@tanstack/react-query"
import { supabase } from "~/lib/supabase"

export const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const
export type Prayer = (typeof PRAYERS)[number]

export interface PrayerRemaining {
  prayer: Prayer
  remaining: number
}

export function usePrayerRemaining() {
  return useQuery({
    queryKey: ["prayer-remaining"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_remaining")
        .select("prayer, remaining")
      if (error) throw error
      // Floor at 0 in display; preserve real in DB
      return (data as PrayerRemaining[]).map((r) => ({
        ...r,
        displayRemaining: Math.max(0, r.remaining ?? 0),
      }))
    },
  })
}

export function useFastingRemaining() {
  return useQuery({
    queryKey: ["fasting-remaining"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fasting_remaining")
        .select("remaining")
        .single()
      if (error && error.code !== "PGRST116") throw error
      const raw = (data as { remaining: number } | null)?.remaining ?? 0
      return { remaining: raw, displayRemaining: Math.max(0, raw) }
    },
  })
}
