import { useEffect } from "react"
import { useNavigate } from "react-router"
import { supabase } from "~/lib/supabase"

async function resolvePostAuth(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, onboarded_at")
    .eq("user_id", userId)
    .single()

  if (!profile) {
    await supabase.from("profiles").insert({
      user_id: userId,
      birth_year: new Date().getFullYear() - 25,
      gender: "male",
      locale: "id",
      timezone: "Asia/Jakarta",
    })
    return "/onboarding/basics"
  }

  return profile.onboarded_at ? "/" : "/onboarding/basics"
}

export default function Callback() {
  const navigate = useNavigate()

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")

    if (code) {
      // PKCE flow (Google OAuth)
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (error || !data.user) {
          navigate("/auth/sign-in")
          return
        }
        const dest = await resolvePostAuth(data.user.id)
        navigate(dest)
      })
      return
    }

    // Hash-based magic link: supabase-js auto-sets session from URL hash.
    // Listen for the SIGNED_IN event it fires.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          subscription.unsubscribe()
          const dest = await resolvePostAuth(session.user.id)
          navigate(dest)
        }
      }
    )

    // Timeout fallback if no event fires (e.g. stale/invalid link)
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      navigate("/auth/sign-in")
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground text-sm">Signing in...</p>
    </div>
  )
}
