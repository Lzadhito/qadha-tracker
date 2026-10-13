import { describe, it, expect, vi, afterEach } from "vitest"
import { PRAYERS, getRemainingPrayers, wibDateStr } from "./use-remaining"
import type { Prayer } from "./use-remaining"

// ─── getRemainingPrayers ─────────────────────────────────────────────────────

describe("getRemainingPrayers", () => {
  it("returns all 5 when none done", () => {
    expect(getRemainingPrayers(new Set())).toEqual([...PRAYERS])
  })

  it("returns empty when all 5 done", () => {
    expect(getRemainingPrayers(new Set(PRAYERS))).toEqual([])
  })

  it("excludes only the done prayers", () => {
    const done = new Set<Prayer>(["subuh"])
    expect(getRemainingPrayers(done)).toEqual(["zuhur", "asar", "maghrib", "isya"])
  })

  it("preserves order", () => {
    const done = new Set<Prayer>(["zuhur", "maghrib"])
    expect(getRemainingPrayers(done)).toEqual(["subuh", "asar", "isya"])
  })

  it("count: remaining = 5 - done", () => {
    const done = new Set<Prayer>(["subuh", "zuhur", "asar"])
    expect(getRemainingPrayers(done)).toHaveLength(2)
  })
})

// ─── button visibility ────────────────────────────────────────────────────────

describe("log-remaining button visibility", () => {
  function shouldShowButton(done: Set<Prayer>): boolean {
    const remaining = PRAYERS.length - done.size
    return done.size > 0 && remaining > 0
  }

  it("hidden when nothing done today", () => {
    expect(shouldShowButton(new Set())).toBe(false)
  })

  it("shown after first prayer logged", () => {
    expect(shouldShowButton(new Set<Prayer>(["subuh"]))).toBe(true)
  })

  it("shown with 4 done (1 remaining)", () => {
    expect(shouldShowButton(new Set<Prayer>(["subuh", "zuhur", "asar", "maghrib"]))).toBe(true)
  })

  it("hidden when all 5 done", () => {
    expect(shouldShowButton(new Set(PRAYERS))).toBe(false)
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
