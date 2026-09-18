import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { getSupabase } from "~/lib/supabase"
import { getSession } from "~/lib/auth"

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: Infinity,
  })

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    getSupabase().then((supabase) => {
      if (cancelled) return
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, _session) => {
        query.refetch()
      })
      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [query])

  return query
}
