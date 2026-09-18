import type { Session, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  )
}

let client: Promise<SupabaseClient> | undefined

// supabase-js is the biggest dependency (~50KB gz) and nothing on first paint needs it, so it
// is loaded on first use instead of shipping in the initial bundle.
export function getSupabase(): Promise<SupabaseClient> {
  client ??= import("@supabase/supabase-js").then(
    ({ createClient }) => createClient(supabaseUrl, supabaseAnonKey),
    (err) => {
      client = undefined // chunk failed to load (e.g. offline): let the next call retry
      throw err
    }
  )
  return client
}

// Same key supabase-js derives by default, so existing sessions keep working.
const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`

// Reads the persisted session without loading supabase-js or awaiting getSession(), which blocks
// on a network token refresh whenever the access token has expired (i.e. after ~1h idle). The
// refresh token is what keeps the user signed in, so an expired access token still counts;
// supabase-js refreshes it in the background once loaded.
export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(storageKey)
    const session = raw ? (JSON.parse(raw) as Session) : null
    return session?.refresh_token && session.user?.id ? session : null
  } catch {
    return null
  }
}
