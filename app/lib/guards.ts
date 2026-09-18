import { redirect } from "react-router"
import { getSupabase, readStoredSession } from "./supabase"

export async function requireAuth() {
  const stored = readStoredSession()
  if (stored) return stored

  const supabase = await getSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw redirect("/auth/sign-in")
  }
  return session
}

// onboarded_at is write-once in the DB and uid-keyed, so a cached flag can't go stale.
// Never cleared on sign-out: it stays valid for that uid.
const onboardedFlag = (uid: string) => `qadha:onboarded:${uid}`

export async function requireOnboarded() {
  const session = await requireAuth()

  if (localStorage.getItem(onboardedFlag(session.user.id))) {
    return { session, profile: null }
  }

  const supabase = await getSupabase()
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", session.user.id)
    .maybeSingle()

  if (!profile?.onboarded_at) {
    throw redirect("/onboarding/basics")
  }
  localStorage.setItem(onboardedFlag(session.user.id), profile.onboarded_at)
  return { session, profile }
}

export async function requireUnonboarded() {
  const session = await requireAuth()

  const supabase = await getSupabase()
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", session.user.id)
    .maybeSingle()

  if (profile?.onboarded_at) {
    throw redirect("/")
  }
  return { session, profile }
}
