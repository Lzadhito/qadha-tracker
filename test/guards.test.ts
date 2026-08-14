import { describe, expect, it, vi, beforeEach } from "vitest"
import { requireOnboarded } from "../app/lib/guards"

vi.mock("../app/lib/supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}))

import { supabase } from "../app/lib/supabase"

const UID = "user-1"
const FLAG = `qadha:onboarded:${UID}`
const session = { user: { id: UID } }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session } } as never)
})

it("skips the profiles fetch when the onboarded flag is cached", async () => {
  localStorage.setItem(FLAG, "2026-08-01T00:00:00Z")
  await requireOnboarded()
  expect(supabase.from).not.toHaveBeenCalled()
})

it("caches the flag after a confirmed fetch", async () => {
  vi.mocked(supabase.from).mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { onboarded_at: "2026-08-01T00:00:00Z" }, error: null }),
      }),
    }),
  } as never)
  await requireOnboarded()
  expect(localStorage.getItem(FLAG)).toBe("2026-08-01T00:00:00Z")
})

it("redirects to onboarding when no flag and not onboarded", async () => {
  vi.mocked(supabase.from).mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { onboarded_at: null }, error: null }),
      }),
    }),
  } as never)
  const err = await requireOnboarded().catch((e) => e)
  expect(err).toBeInstanceOf(Response)
  expect((err as Response).status).toBe(302)
  expect((err as Response).headers.get("Location")).toBe("/onboarding/basics")
})
