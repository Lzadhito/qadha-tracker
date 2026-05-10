import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "~/lib/supabase"
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
