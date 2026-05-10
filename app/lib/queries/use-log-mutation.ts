import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "~/lib/supabase"
import { PRAYERS } from "./use-remaining"
import type { Prayer } from "./use-remaining"

interface PrayerLogPayload {
  prayer: Prayer
  entryType: "qadha" | "miss"
  amount: number
  loggedAt?: string
}

interface FastingLogPayload {
  entryType: "qadha" | "miss"
  amount: number
  fastedOn?: string
  loggedAt?: string
}

export function usePrayerLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ prayer, entryType, amount, loggedAt }: PrayerLogPayload) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const { error } = await supabase.from("prayer_ledger").insert({
        user_id: session.user.id,
        prayer,
        entry_type: entryType,
        amount: entryType === "qadha" ? -Math.abs(amount) : Math.abs(amount),
        ...(loggedAt ? { logged_at: loggedAt } : {}),
      })
      if (error) throw error
    },
    onMutate: async ({ prayer, entryType, amount }) => {
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])

      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) =>
          r.prayer === prayer
            ? {
                ...r,
                remaining:
                  r.remaining +
                  (entryType === "qadha" ? -amount : amount),
                displayRemaining: Math.max(
                  0,
                  r.remaining + (entryType === "qadha" ? -amount : amount)
                ),
              }
            : r
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["prayer-remaining"], context.previous)
      }
      toast.error("Failed to log. Try again.")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
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
    mutationFn: async ({ loggedAt }: { loggedAt?: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")
      const rows = PRAYERS.map((prayer) => ({
        user_id: session.user.id,
        prayer,
        entry_type: "qadha" as const,
        amount: -1,
        ...(loggedAt ? { logged_at: loggedAt } : {}),
      }))
      const { error } = await supabase.from("prayer_ledger").insert(rows)
      if (error) throw error
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["prayer-remaining"] })
      const previous = qc.getQueryData(["prayer-remaining"])
      qc.setQueryData(["prayer-remaining"], (old: any[]) =>
        old?.map((r) => ({
          ...r,
          remaining: r.remaining - 1,
          displayRemaining: Math.max(0, r.remaining - 1),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
      qc.invalidateQueries({ queryKey: ["history"] })
      toast.success("Remaining adjusted.")
    },
    onError: () => toast.error("Failed to adjust."),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fasting-remaining"] })
      qc.invalidateQueries({ queryKey: ["history"] })
      toast.success("Remaining adjusted.")
    },
    onError: () => toast.error("Failed to adjust."),
  })
}
