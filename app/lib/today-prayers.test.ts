import { describe, it, expect, vi } from "vitest"
import { getTodayDone, toggleTodayPrayer } from "./today-prayers"

const WIB_OFFSET = 7 * 60 * 60 * 1000

function mockDate(isoDate: string) {
  const base = new Date(`${isoDate}T00:00:00Z`).getTime() - WIB_OFFSET
  vi.spyOn(Date, "now").mockReturnValue(base)
}

describe("getTodayDone", () => {
  it("returns empty set when nothing logged", () => {
    mockDate("2026-06-06")
    expect(getTodayDone().size).toBe(0)
  })
})

describe("toggleTodayPrayer", () => {
  it("adds prayer on first toggle", () => {
    mockDate("2026-06-06")
    const done = toggleTodayPrayer("subuh")
    expect(done.has("subuh")).toBe(true)
  })

  it("removes prayer on second toggle", () => {
    mockDate("2026-06-06")
    toggleTodayPrayer("subuh")
    const done = toggleTodayPrayer("subuh")
    expect(done.has("subuh")).toBe(false)
  })

  it("multiple prayers tracked independently", () => {
    mockDate("2026-06-06")
    toggleTodayPrayer("subuh")
    toggleTodayPrayer("zuhur")
    const done = getTodayDone()
    expect(done.has("subuh")).toBe(true)
    expect(done.has("zuhur")).toBe(true)
    expect(done.has("asar")).toBe(false)
  })

  it("resets when date changes", () => {
    mockDate("2026-06-06")
    toggleTodayPrayer("subuh")
    expect(getTodayDone().size).toBe(1)

    mockDate("2026-06-07")
    expect(getTodayDone().size).toBe(0)
  })

  it("persists across getTodayDone calls on same day", () => {
    mockDate("2026-06-06")
    toggleTodayPrayer("maghrib")
    toggleTodayPrayer("isya")
    const done = getTodayDone()
    expect(done.has("maghrib")).toBe(true)
    expect(done.has("isya")).toBe(true)
  })
})
