import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSupabase, readStoredSession } from "~/lib/supabase"
import { groupByDay, mergePendingQadha, qadhaDay, type QadhaEntry } from "~/lib/month-qadha"
import { wibDayRange } from "~/lib/wib"
import { usePendingOps, type Prayer } from "./use-remaining"

// monthKey is "yyyy-MM". Fetches every qadha whose WIB day falls in that month, from both ledgers.
async function fetchMonth(monthKey: string): Promise<QadhaEntry[]> {
  const uid = readStoredSession()?.user.id
  if (!uid) throw new Error("Not signed in")
  const supabase = await getSupabase()
  const [y, m] = monthKey.split("-").map(Number)
  const first = `${monthKey}-01`
  const last = `${monthKey}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`
  const { start } = wibDayRange(first)
  const { end } = wibDayRange(last)

  const prayers = await supabase
    .from("prayer_ledger")
    .select("id, prayer, anchor, amount, logged_at")
    .eq("user_id", uid)
    .eq("entry_type", "qadha")
    .gte("logged_at", start)
    .lte("logged_at", end)
  if (prayers.error) throw prayers.error

  // A fast with a known fasted_on counts there; otherwise on the day it was logged.
  const fasting = await supabase
    .from("fasting_ledger")
    .select("id, amount, logged_at, fasted_on")
    .eq("user_id", uid)
    .eq("entry_type", "qadha")
    .or(
      `and(fasted_on.gte.${first},fasted_on.lte.${last}),and(fasted_on.is.null,logged_at.gte.${start},logged_at.lte.${end})`
    )
  if (fasting.error) throw fasting.error

  return [
    ...(prayers.data ?? []).map((r) => ({
      id: r.id as string,
      obligation: "prayer" as const,
      prayer: r.prayer as Prayer,
      anchor: r.anchor as Prayer | null,
      entry_type: "qadha" as const,
      amount: Number(r.amount),
      logged_at: r.logged_at as string,
      day: qadhaDay(r.logged_at as string),
    })),
    ...(fasting.data ?? []).map((r) => ({
      id: r.id as string,
      obligation: "fasting" as const,
      entry_type: "qadha" as const,
      amount: Number(r.amount),
      logged_at: r.logged_at as string,
      day: qadhaDay(r.logged_at as string, r.fasted_on as string | null),
    })),
  ].filter((e) => e.day.startsWith(monthKey))
}

export function useMonthQadha(monthKey: string) {
  const query = useQuery({ queryKey: ["month-qadha", monthKey], queryFn: () => fetchMonth(monthKey) })
  const pending = usePendingOps()
  // Pending logs and undos show before the server answers, same as "logged today".
  const days = useMemo(
    () => groupByDay(mergePendingQadha(query.data ?? [], pending, monthKey)),
    [query.data, pending, monthKey]
  )
  return { days, isLoading: query.isLoading }
}
