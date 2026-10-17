import { describe, expect, it } from "vitest"
import type { Prayer, PrayerRemaining } from "~/lib/queries/use-remaining"
import { visiblePrayers } from "./visible-prayers"

const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const
const rows = (remaining: Partial<Record<Prayer, number>>): PrayerRemaining[] =>
  PRAYERS.map((prayer) => {
    const r = remaining[prayer] ?? 3
    return { prayer, remaining: r, displayRemaining: Math.max(0, r) }
  })

describe("visiblePrayers", () => {
  it("shows all while loading", () => {
    expect(visiblePrayers(PRAYERS, undefined, new Set())).toEqual([...PRAYERS])
  })
  it("hides paid-off prayers", () => {
    expect(visiblePrayers(PRAYERS, rows({ subuh: 0 }), new Set())).toEqual(["zuhur", "asar", "maghrib", "isya"])
  })
  it("keeps a paid-off prayer logged today", () => {
    expect(visiblePrayers(PRAYERS, rows({ asar: 0 }), new Set<Prayer>(["asar"]))).toEqual([...PRAYERS])
  })
  it("hides negative remaining", () => {
    expect(visiblePrayers(PRAYERS, rows({ isya: -2 }), new Set())).not.toContain("isya")
  })
  it("returns empty when all paid off", () => {
    const all = Object.fromEntries(PRAYERS.map((p) => [p, 0]))
    expect(visiblePrayers(PRAYERS, rows(all), new Set())).toEqual([])
  })
})
