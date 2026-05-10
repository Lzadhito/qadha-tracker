import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "~/lib/supabase"

export type ObligationType = "all" | "prayer" | "fasting"
export type EntryType = "all" | "qadha" | "miss" | "adjustment"

const PAGE_SIZE = 50

export function useHistory(
  obligation: ObligationType = "all",
  entryType: EntryType = "all"
) {
  return useInfiniteQuery({
    queryKey: ["history", obligation, entryType],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const prayers =
        obligation === "fasting"
          ? []
          : await (async () => {
              let q = supabase
                .from("prayer_ledger")
                .select("id, prayer, entry_type, amount, logged_at")
                .neq("entry_type", "baseline")
                .order("logged_at", { ascending: false })
                .range(from, to)
              if (entryType !== "all") q = q.eq("entry_type", entryType)
              const { data, error } = await q
              if (error) throw error
              return (data ?? []).map((r) => ({ ...r, obligation: "prayer" as const }))
            })()

      const fasting =
        obligation === "prayer"
          ? []
          : await (async () => {
              let q = supabase
                .from("fasting_ledger")
                .select("id, entry_type, amount, fasted_on, logged_at")
                .neq("entry_type", "baseline")
                .order("logged_at", { ascending: false })
                .range(from, to)
              if (entryType !== "all") q = q.eq("entry_type", entryType)
              const { data, error } = await q
              if (error) throw error
              return (data ?? []).map((r) => ({ ...r, obligation: "fasting" as const }))
            })()

      return [...prayers, ...fasting].sort(
        (a, b) =>
          new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
      )
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      obligation,
    }: {
      id: string
      obligation: "prayer" | "fasting"
    }) => {
      const table =
        obligation === "prayer" ? "prayer_ledger" : "fasting_ledger"
      const { error } = await supabase.from(table).delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] })
      qc.invalidateQueries({ queryKey: ["prayer-remaining"] })
      qc.invalidateQueries({ queryKey: ["fasting-remaining"] })
    },
    onError: () => toast.error("Failed to delete entry."),
  })
}
