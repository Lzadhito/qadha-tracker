import { describe, it, expect, vi, afterEach } from "vitest"
import { PRAYERS, getRemainingPrayers, resolveExclude, wibDateStr } from "./use-remaining"
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

// ─── resolveExclude ───────────────────────────────────────────────────────────

const TODAY = "2026-06-06"
const YESTERDAY = "2026-06-05"
const todayDone = new Set<Prayer>(["subuh"])
const yesterdayDone = new Set<Prayer>(["subuh", "zuhur"])

function d(dateStr: string) {
  return new Date(`${dateStr}T12:00:00+07:00`)
}

describe("resolveExclude", () => {
  it("no selection → todayDone", () => {
    const result = resolveExclude({
      rangeFrom: undefined,
      rangeTo: undefined,
      todayKey: TODAY,
      todayDone,
      fetchedDone: undefined,
    })
    expect(result).toBe(todayDone)
  })

  it("single date = today → todayDone", () => {
    const result = resolveExclude({
      rangeFrom: d(TODAY),
      rangeTo: undefined,
      todayKey: TODAY,
      todayDone,
      fetchedDone: yesterdayDone,
    })
    expect(result).toBe(todayDone)
  })

  it("single date = today with same rangeTo → todayDone", () => {
    const result = resolveExclude({
      rangeFrom: d(TODAY),
      rangeTo: d(TODAY),
      todayKey: TODAY,
      todayDone,
      fetchedDone: yesterdayDone,
    })
    expect(result).toBe(todayDone)
  })

  it("single past date, fetch loaded → fetchedDone", () => {
    const result = resolveExclude({
      rangeFrom: d(YESTERDAY),
      rangeTo: undefined,
      todayKey: TODAY,
      todayDone,
      fetchedDone: yesterdayDone,
    })
    expect(result).toBe(yesterdayDone)
  })

  it("single past date, fetch not yet loaded → empty set (log all 5)", () => {
    const result = resolveExclude({
      rangeFrom: d(YESTERDAY),
      rangeTo: undefined,
      todayKey: TODAY,
      todayDone,
      fetchedDone: undefined,
    })
    expect(result.size).toBe(0)
  })

  it("date range → empty set (log all 5 per day)", () => {
    const result = resolveExclude({
      rangeFrom: d(YESTERDAY),
      rangeTo: d(TODAY),
      todayKey: TODAY,
      todayDone,
      fetchedDone: yesterdayDone,
    })
    expect(result.size).toBe(0)
  })

  it("past single date with no prior logs → remaining = all 5", () => {
    const result = resolveExclude({
      rangeFrom: d(YESTERDAY),
      rangeTo: undefined,
      todayKey: TODAY,
      todayDone,
      fetchedDone: new Set(),
    })
    expect(getRemainingPrayers(result)).toEqual([...PRAYERS])
  })

  it("past single date with 3 logged → remaining = 2", () => {
    const done = new Set<Prayer>(["subuh", "zuhur", "asar"])
    const result = resolveExclude({
      rangeFrom: d(YESTERDAY),
      rangeTo: undefined,
      todayKey: TODAY,
      todayDone,
      fetchedDone: done,
    })
    expect(getRemainingPrayers(result)).toEqual(["maghrib", "isya"])
  })
})
