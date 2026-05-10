import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { supabase } from "~/lib/supabase"
import { getSession } from "~/lib/auth"

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: Infinity,
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      query.refetch()
    })

    return () => subscription?.unsubscribe()
  }, [query])

  return query
}
