import { describe, it, expect, vi, afterEach } from "vitest"
import { countByPrayer, loggedCells, wibDateStr } from "./use-remaining"

// ─── day log helpers ──────────────────────────────────────────────────────────

describe("countByPrayer / loggedCells", () => {
  const entries = [
    { prayer: "subuh", anchor: "subuh" },
    { prayer: "subuh", anchor: "maghrib" },
    { prayer: "subuh", anchor: null },
    { prayer: "asar", anchor: "isya" },
  ] as const

  it("counts every entry of a prayer, anchored or not", () => {
    expect(countByPrayer(entries)).toEqual({ subuh: 3, zuhur: 0, asar: 1, maghrib: 0, isya: 0 })
  })

  it("fills a cell only for anchored entries", () => {
    expect([...loggedCells(entries)].sort()).toEqual(["asar:isya", "subuh:maghrib", "subuh:subuh"])
  })
})

// ─── wibDateStr ───────────────────────────────────────────────────────────────

const WIB = 7 * 60 * 60 * 1000

describe("wibDateStr", () => {
  afterEach(() => vi.restoreAllMocks())

  it("returns yyyy-MM-dd format", () => {
    expect(wibDateStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("reflects WIB offset — UTC 17:00 = next day in WIB (UTC+7)", () => {
    // 2026-06-06T17:00:00Z = 2026-06-07T00:00:00+07:00
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-06-06T17:00:00Z").getTime())
    expect(wibDateStr()).toBe("2026-06-07")
  })

  it("reflects WIB offset — UTC 16:59 = same day in WIB", () => {
    // 2026-06-06T16:59:00Z = 2026-06-06T23:59:00+07:00
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-06-06T16:59:00Z").getTime())
    expect(wibDateStr()).toBe("2026-06-06")
  })
})
