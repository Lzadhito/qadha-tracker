import { describe, it, expect } from "vitest"
import { countByDay, groupByDay, mergePendingQadha, qadhaDay, type QadhaEntry } from "./month-qadha"
import type { Op } from "./outbox"

const entry = (id: string, prayer: QadhaEntry["prayer"], logged_at: string): QadhaEntry => ({
  id, obligation: "prayer", prayer, entry_type: "qadha", amount: -1, logged_at, day: qadhaDay(logged_at),
})

describe("qadhaDay", () => {
  it("uses the WIB day, not UTC, either side of midnight", () => {
    expect(qadhaDay("2026-10-12T16:30:00Z")).toBe("2026-10-12") // 23:30 WIB
    expect(qadhaDay("2026-10-12T17:30:00Z")).toBe("2026-10-13") // 00:30 WIB next day
  })

  it("prefers the fasted day for fasting", () => {
    expect(qadhaDay("2026-10-12T05:00:00Z", "2026-10-05")).toBe("2026-10-05")
  })
})

describe("mergePendingQadha", () => {
  const insert = (rows: Extract<Op, { kind: "insert" }>["rows"], table: "prayer_ledger" | "fasting_ledger" = "prayer_ledger"): Op => ({
    id: "op1", uid: "u", kind: "insert", table, rows,
  })

  it("adds pending qadha, ignoring adjustments and other months", () => {
    const ops = [
      insert([
        { id: "a", user_id: "u", prayer: "subuh", entry_type: "qadha", amount: -1, logged_at: "2026-10-13T00:00:00Z" },
        { id: "b", user_id: "u", prayer: "subuh", entry_type: "adjustment", amount: 5, logged_at: "2026-10-13T00:00:00Z" },
        { id: "c", user_id: "u", prayer: "isya", entry_type: "qadha", amount: -1, logged_at: "2026-09-13T00:00:00Z" },
      ]),
    ]
    const out = mergePendingQadha([], ops, "2026-10")
    expect(out.map((e) => e.id)).toEqual(["a"])
  })

  it("does not double count a row that already synced", () => {
    const synced = entry("a", "subuh", "2026-10-13T00:00:00Z")
    const ops = [insert([{ id: "a", user_id: "u", prayer: "subuh", entry_type: "qadha", amount: -1, logged_at: synced.logged_at }])]
    expect(mergePendingQadha([synced], ops, "2026-10")).toHaveLength(1)
  })

  it("undo removes the latest entry of that prayer that day, and the day empties", () => {
    const e = entry("a", "asar", "2026-10-13T08:00:00Z")
    const undo: Op = { id: "u1", uid: "u", kind: "undo", prayer: "asar", dateKey: "2026-10-13" }
    expect(groupByDay(mergePendingQadha([e], [undo], "2026-10")).has("2026-10-13")).toBe(false)
  })

  it("undo with nothing to undo (targetId null) changes nothing", () => {
    const e = entry("a", "asar", "2026-10-13T08:00:00Z")
    const undo: Op = { id: "u1", uid: "u", kind: "undo", prayer: "asar", dateKey: "2026-10-13", targetId: null }
    expect(mergePendingQadha([e], [undo], "2026-10")).toEqual([e])
  })
})

describe("countByDay", () => {
  const fast = (id: string, day: string, amount: number): QadhaEntry => ({
    id, obligation: "fasting", entry_type: "qadha", amount, logged_at: `${day}T05:00:00Z`, day,
  })

  it("sums prayers and fasts, using the size of each amount", () => {
    const days = groupByDay([
      entry("a", "subuh", "2026-10-12T00:00:00Z"),
      entry("b", "zuhur", "2026-10-12T05:00:00Z"),
      fast("c", "2026-10-12", -2),
      entry("d", "isya", "2026-10-13T00:00:00Z"),
    ])
    expect(countByDay(days)).toEqual(new Map([["2026-10-12", 4], ["2026-10-13", 1]]))
  })

  it("has no key for a day without qadha", () => {
    expect(countByDay(new Map()).size).toBe(0)
  })
})
