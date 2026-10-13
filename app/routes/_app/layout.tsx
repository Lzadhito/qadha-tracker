import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router"
import { getSupabase, readStoredSession } from "~/lib/supabase"
import { startOutboxSync } from "~/lib/sync"

export default function AppLayout() {
  const navigate = useNavigate()

  // Guards let a stored-but-expired session through without waiting for the refresh; if the
  // refresh really ends the session, bounce to sign-in. Supabase being unreachable also reports
  // INITIAL_SESSION as null but keeps the stored session, so storage is the source of truth.
  useEffect(() => {
    startOutboxSync()

    let unsubscribe: (() => void) | undefined
    let cancelled = false
    getSupabase().then((supabase) => {
      if (cancelled) return
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          (event === "SIGNED_OUT" || event === "INITIAL_SESSION") &&
          !session &&
          !readStoredSession()
        ) {
          navigate("/auth/sign-in", { replace: true })
        }
      })
      unsubscribe = () => subscription.unsubscribe()
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [navigate])

  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  )
}
