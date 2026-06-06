import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "~/lib/supabase"
import { PRAYERS, getRemainingPrayers, wibDateStr } from "./use-remaining"
import type { Prayer } from "./use-remaining"

interface FastingLogPayload {
  entryType: "qadha" | "miss"
  amount: number
  fastedOn?: string
  loggedAt?: string
}

export function usePrayerLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ prayer, loggedDates }: { prayer: Prayer; loggedDates?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const rows = loggedDates
        ? loggedDates.map((loggedAt) => ({
            user_id: session.user.id,
            prayer,
            entry_type: "qadha" as const,
            amount: -1,
            logged_at: loggedAt,
          }))
        : [{ user_id: session.user.id, prayer, entry_type: "qadha" as const, amount: -1 }]

      const { error } = await supabase.from("prayer_ledger").insert(rows)
      if (error) throw error
    },
    onMutate: async ({ prayer, loggedDates }) => {
      const numDays = loggedDates?.length ?? 1
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])

      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) =>
          r.prayer === prayer
            ? {
                ...r,
                remaining: r.remaining - numDays,
                displayRemaining: Math.max(0, r.remaining - numDays),
              }
            : r
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["prayer-remaining"], context.previous)
      toast.error("Failed to log. Try again.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
      qc.invalidateQueries({ queryKey: ["prayer-today"] })
    },
  })
}

export function useFastingLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ entryType, amount, fastedOn, loggedAt }: FastingLogPayload) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const { error } = await supabase.from("fasting_ledger").insert({
        user_id: session.user.id,
        entry_type: entryType,
        amount: entryType === "qadha" ? -Math.abs(amount) : Math.abs(amount),
        ...(fastedOn ? { fasted_on: fastedOn } : {}),
        ...(loggedAt ? { logged_at: loggedAt } : {}),
      })
      if (error) throw error
    },
    onMutate: async ({ entryType, amount }) => {
      await qc.cancelQueries({ queryKey: ["fasting-remaining"] })
      const previous = qc.getQueryData(["fasting-remaining"])

      qc.setQueryData(["fasting-remaining"], (old: any) =>
        old
          ? {
              ...old,
              remaining:
                old.remaining + (entryType === "qadha" ? -amount : amount),
              displayRemaining: Math.max(
                0,
                old.remaining + (entryType === "qadha" ? -amount : amount)
              ),
            }
          : old
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["fasting-remaining"], context.previous)
      }
      toast.error("Failed to log. Try again.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["fasting-remaining"] })
    },
  })
}

export function usePrayerFullDayLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ loggedDates }: { loggedDates?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const rows = loggedDates
        ? loggedDates.flatMap((loggedAt) =>
            PRAYERS.map((prayer) => ({
              user_id: session.user.id,
              prayer,
              entry_type: "qadha" as const,
              amount: -1,
              logged_at: loggedAt,
            }))
          )
        : PRAYERS.map((prayer) => ({
            user_id: session.user.id,
            prayer,
            entry_type: "qadha" as const,
            amount: -1,
          }))
      const { error } = await supabase.from("prayer_ledger").insert(rows)
      if (error) throw error
    },
    onMutate: async ({ loggedDates }) => {
      const numDays = loggedDates?.length ?? 1
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])
      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) => ({
          ...r,
          remaining: r.remaining - numDays,
          displayRemaining: Math.max(0, r.remaining - numDays),
        }))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["prayer-remaining"], ctx.previous)
      toast.error("Failed to log. Try again.")
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["prayer-remaining"] }),
  })
}

export function useLogRemainingToday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exclude, loggedDates }: { exclude: Set<Prayer>; loggedDates?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const toLog = getRemainingPrayers(exclude)
      if (toLog.length === 0) return
      const rows = loggedDates
        ? loggedDates.flatMap((loggedAt) =>
            toLog.map((prayer) => ({
              user_id: session.user.id,
              prayer,
              entry_type: "qadha" as const,
              amount: -1,
              logged_at: loggedAt,
            }))
          )
        : toLog.map((prayer) => ({
            user_id: session.user.id,
            prayer,
            entry_type: "qadha" as const,
            amount: -1,
          }))
      const { error } = await supabase.from("prayer_ledger").insert(rows)
      if (error) throw error
    },
    onMutate: async ({ exclude, loggedDates }) => {
      const numDays = loggedDates?.length ?? 1
      const toLog = getRemainingPrayers(exclude)
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])
      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) =>
          toLog.includes(r.prayer as Prayer)
            ? { ...r, remaining: r.remaining - numDays, displayRemaining: Math.max(0, r.remaining - numDays) }
            : r
        )
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["prayer-remaining"], ctx.previous)
      toast.error("Failed to log. Try again.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
      qc.invalidateQueries({ queryKey: ["prayer-today"] })
    },
  })
}

export function usePrayerAdjust() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ adjustments }: { adjustments: Array<{ prayer: Prayer; delta: number }> }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const rows = adjustments
        .filter((a) => a.delta !== 0)
        .map((a) => ({
          user_id: session.user.id,
          prayer: a.prayer,
          entry_type: "adjustment" as const,
          amount: a.delta,
        }))
      if (rows.length === 0) return
      const { error } = await supabase.from("prayer_ledger").insert(rows)
      if (error) throw error
    },
    onMutate: async ({ adjustments }) => {
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])
      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) => {
          const adj = adjustments.find((a) => a.prayer === r.prayer)
          if (!adj || adj.delta === 0) return r
          const newRemaining = r.remaining + adj.delta
          return { ...r, remaining: newRemaining, displayRemaining: Math.max(0, newRemaining) }
        })
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["prayer-remaining"], ctx.previous)
      toast.error("Failed to adjust.")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] })
      toast.success("Remaining adjusted.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
    },
  })
}

export function useUndoTodayPrayerLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ prayer }: { prayer: Prayer }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const dateKey = wibDateStr()
      const start = new Date(`${dateKey}T00:00:00+07:00`)
      const end = new Date(`${dateKey}T23:59:59.999+07:00`)
      const { data, error } = await supabase
        .from("prayer_ledger")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("prayer", prayer)
        .eq("entry_type", "qadha")
        .gte("logged_at", start.toISOString())
        .lte("logged_at", end.toISOString())
        .order("logged_at", { ascending: false })
        .limit(1)
      if (error) throw error
      if (!data?.length) return
      const { error: deleteError } = await supabase.from("prayer_ledger").delete().eq("id", data[0].id)
      if (deleteError) throw deleteError
    },
    onMutate: async ({ prayer }) => {
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])
      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) =>
          r.prayer === prayer
            ? { ...r, remaining: r.remaining + 1, displayRemaining: Math.max(0, r.remaining + 1) }
            : r
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["prayer-remaining"], context.previous)
      toast.error("Failed to undo. Try again.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
      qc.invalidateQueries({ queryKey: ["prayer-today"] })
    },
  })
}

export function useFastingAdjust() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ delta }: { delta: number }) => {
      if (delta === 0) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const { error } = await supabase.from("fasting_ledger").insert({
        user_id: session.user.id,
        entry_type: "adjustment",
        amount: delta,
      })
      if (error) throw error
    },
    onMutate: async ({ delta }) => {
      await qc.cancelQueries({ queryKey: ["fasting-remaining"] })
      const previous = qc.getQueryData(["fasting-remaining"])
      qc.setQueryData(["fasting-remaining"], (old: any) =>
        old ? { ...old, remaining: old.remaining + delta, displayRemaining: Math.max(0, old.remaining + delta) } : old
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["fasting-remaining"], ctx.previous)
      toast.error("Failed to adjust.")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] })
      toast.success("Remaining adjusted.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["fasting-remaining"] })
    },
  })
}
