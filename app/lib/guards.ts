import { redirect } from "react-router"
import { supabase } from "./supabase"

export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw redirect("/auth/sign-in")
  }
  return session
}

export async function requireOnboarded() {
  const session = await requireAuth()

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", session.user.id)
    .maybeSingle()

  if (!profile?.onboarded_at) {
    throw redirect("/onboarding/basics")
  }
  return { session, profile }
}

export async function requireUnonboarded() {
  const session = await requireAuth()

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
