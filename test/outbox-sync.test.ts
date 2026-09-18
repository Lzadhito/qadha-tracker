import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const UID = "user-1"

type Result = { data?: unknown; error?: { code: string; message: string } | null }
type Handler = (table: string, calls: [string, unknown[]][]) => Result

// Chainable fake of the PostgREST builder: records every call, resolves at .abortSignal().
function fakeSupabase(handler: { current: Handler }) {
  const requests: { table: string; calls: [string, unknown[]][] }[] = []
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: UID } } }, error: null })),
    },
    from: (table: string) => {
      const calls: [string, unknown[]][] = []
      requests.push({ table, calls })
      const chain: object = new Proxy({}, {
        get: (_, method: string) => (...args: unknown[]) => {
          if (method === "abortSignal") return Promise.resolve(handler.current(table, calls))
          calls.push([method, args])
          return chain
        },
      })
      return chain
    },
  }
  return { client, requests }
}

const handler: { current: Handler } = { current: () => ({ error: null }) }
let fake: ReturnType<typeof fakeSupabase>

vi.mock("~/lib/supabase", () => ({
  getSupabase: async () => fake.client,
  readStoredSession: () => ({ user: { id: UID } }),
}))

async function load() {
  vi.resetModules()
  const [outbox, actions, sync, remaining, qc] = await Promise.all([
    import("~/lib/outbox"),
    import("~/lib/log-actions"),
    import("~/lib/sync"),
    import("~/lib/queries/use-remaining"),
    import("~/lib/query-client"),
  ])
  return { ...outbox, ...actions, ...sync, ...remaining, queryClient: qc.queryClient }
}

beforeEach(() => {
  handler.current = () => ({ error: null })
  fake = fakeSupabase(handler)
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

const inserts = () => fake.requests.filter((r) => r.calls.some(([m]) => m === "insert"))

describe("outbox sync", () => {
  it("records locally and synchronously, before any network call resolves", async () => {
    const m = await load()
    handler.current = () => new Promise(() => {}) as never // Supabase hangs
    m.logPrayer("subuh")
    const [op] = m.getOps()
    expect(op).toMatchObject({ uid: UID, kind: "insert", table: "prayer_ledger" })
    expect(op.kind === "insert" && op.rows[0]).toMatchObject({ user_id: UID, prayer: "subuh", entry_type: "qadha", amount: -1 })
    expect(JSON.parse(localStorage.getItem("qadha:outbox")!)).toHaveLength(1)
  })

  it("keeps the op while Supabase is unreachable and syncs it on a later flush", async () => {
    const m = await load()
    handler.current = () => ({ error: { code: "", message: "TypeError: Failed to fetch" } })
    m.logPrayer("zuhur")
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled())
    expect(m.getOps()).toHaveLength(1)

    handler.current = () => ({ error: null })
    m.queryClient.setQueryData(["prayer-remaining"], m.PRAYERS.map((prayer) => ({ prayer, remaining: 10, displayRemaining: 10 })))
    m.flushOutbox()
    await vi.waitFor(() => expect(m.getOps()).toHaveLength(0))

    // Same client ids on the retry, so a request that landed the first time can't duplicate.
    const [first, second] = inserts()
    expect(second.calls[0][1]).toEqual(first.calls[0][1])
    // Synced op is folded into the server cache so the displayed count doesn't jump back.
    const zuhur = m.queryClient.getQueryData<{ prayer: string; remaining: number }[]>(["prayer-remaining"])!
      .find((r) => r.prayer === "zuhur")
    expect(zuhur?.remaining).toBe(9)
  })

  it("treats a duplicate-id error as already synced", async () => {
    const m = await load()
    handler.current = () => ({ error: { code: "23505", message: "duplicate key" } })
    m.logFasting()
    await vi.waitFor(() => expect(m.getOps()).toHaveLength(0))
  })

  it("drops an op the database rejects outright instead of blocking the queue", async () => {
    const m = await load()
    handler.current = (table) =>
      table === "fasting_ledger" ? { error: { code: "23514", message: "check violation" } } : { error: null }
    m.logFasting()
    m.logPrayer("asar")
    await vi.waitFor(() => expect(m.getOps()).toHaveLength(0))
    expect(inserts().map((r) => r.table)).toEqual(["fasting_ledger", "prayer_ledger"])
  })

  it("undo of a log that never synced cancels it locally", async () => {
    const m = await load()
    handler.current = () => ({ error: { code: "", message: "offline" } })
    m.logFullDay()
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled())
    fake.requests.length = 0

    m.undoTodayPrayer("maghrib")
    const [op] = m.getOps()
    expect(op.kind === "insert" && op.rows.map((r) => r.prayer)).toEqual(["subuh", "zuhur", "asar", "isya"])
    expect(m.getOps()).toHaveLength(1)
  })

  it("undo of a synced log resolves the row once and retries the delete by that id", async () => {
    const m = await load()
    let deletes = 0
    handler.current = (_table, calls) => {
      if (calls.some(([method]) => method === "select")) return { data: [{ id: "row-9" }], error: null }
      deletes++
      return deletes === 1 ? { error: { code: "", message: "timeout" } } : { error: null }
    }
    m.undoTodayPrayer("isya")
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled())
    expect(m.getOps()[0]).toMatchObject({ kind: "undo", targetId: "row-9" })

    m.flushOutbox()
    await vi.waitFor(() => expect(m.getOps()).toHaveLength(0))
    const selects = fake.requests.filter((r) => r.calls.some(([method]) => method === "select"))
    expect(selects).toHaveLength(1)
    const deleteCalls = fake.requests.filter((r) => r.calls.some(([method]) => method === "delete"))
    expect(deleteCalls.map((r) => r.calls.find(([method]) => method === "eq")?.[1])).toEqual([["id", "row-9"], ["id", "row-9"]])
  })
})

describe("pending ops overlay", () => {
  it("adds pending logs to today's set and counts", async () => {
    const m = await load()
    handler.current = () => new Promise(() => {}) as never
    m.logPrayer("subuh")
    const today = new Set<import("~/lib/queries/use-remaining").Prayer>()
    for (const op of m.getOps()) m.applyToDaySet(today, op, m.wibDateStr())
    expect([...today]).toEqual(["subuh"])
    expect(m.prayerDeltas(m.getOps()[0])).toEqual({ subuh: -1 })
  })
})
