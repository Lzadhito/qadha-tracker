import { supabase } from "./supabase"

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error }
}

export async function signInWithGoogle() {
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error, data }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function exchangeCodeForSession(code: string) {
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)
  return { error, data }
}
