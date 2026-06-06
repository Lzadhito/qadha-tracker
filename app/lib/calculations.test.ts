import { describe, it, expect } from "vitest"
import { prayerBaselineForPhase, fastingBaselineForPhase } from "./calculations"

describe("prayerBaselineForPhase", () => {
  it("returns 0 when missedPct is 0", () => {
    expect(prayerBaselineForPhase({ startYear: 2010, endYear: 2010, missedPct: 0 }, { gender: "male" })).toBe(0)
  })

  it("counts full year for male (no menstruation deduction)", () => {
    const result = prayerBaselineForPhase(
      { startYear: 2010, endYear: 2010, missedPct: 100 },
      { gender: "male" }
    )
    expect(result).toBe(365)
  })

  it("deducts menstruation days for female", () => {
    const avgPeriodDays = 6
    const result = prayerBaselineForPhase(
      { startYear: 2010, endYear: 2010, missedPct: 100 },
      { gender: "female", avgPeriodDays }
    )
    const expected = 365 - 12 * avgPeriodDays
    expect(result).toBe(expected)
  })

  it("no deduction for female without avgPeriodDays", () => {
    const result = prayerBaselineForPhase(
      { startYear: 2010, endYear: 2010, missedPct: 100 },
      { gender: "female" }
    )
    expect(result).toBe(365)
  })

  it("spans multiple years correctly", () => {
    const result = prayerBaselineForPhase(
      { startYear: 2010, endYear: 2012, missedPct: 100 },
      { gender: "male" }
    )
    expect(result).toBe(3 * 365)
  })

  it("applies missedPct proportionally", () => {
    const result = prayerBaselineForPhase(
      { startYear: 2010, endYear: 2010, missedPct: 50 },
      { gender: "male" }
    )
    expect(result).toBe(Math.round(365 * 0.5))
  })
})

describe("fastingBaselineForPhase", () => {
  it("returns 0 when daysMissedPerRamadan is 0", () => {
    const result = fastingBaselineForPhase(
      { startYear: 2010, endYear: 2010, pattern: "all_fasted", daysMissedPerRamadan: 0 },
      { gender: "male" }
    )
    expect(result).toBe(0)
  })

  it("multiplies missed days by ramadans", () => {
    const result = fastingBaselineForPhase(
      { startYear: 2010, endYear: 2012, pattern: "all_fasted", daysMissedPerRamadan: 5 },
      { gender: "male" }
    )
    expect(result).toBe(15) // 3 years * 5 days
  })

  it("adds menstruation days for female on all_fasted pattern", () => {
    const result = fastingBaselineForPhase(
      { startYear: 2010, endYear: 2010, pattern: "all_fasted", daysMissedPerRamadan: 0 },
      { gender: "female", avgPeriodInRamadan: 6 }
    )
    expect(result).toBe(6)
  })

  it("does NOT add menstruation for patterns that already include it (half)", () => {
    const result = fastingBaselineForPhase(
      { startYear: 2010, endYear: 2010, pattern: "half", daysMissedPerRamadan: 15 },
      { gender: "female", avgPeriodInRamadan: 6 }
    )
    expect(result).toBe(15)
  })

  it("caps at 30 days per Ramadan", () => {
    const result = fastingBaselineForPhase(
      { startYear: 2010, endYear: 2010, pattern: "all_fasted", daysMissedPerRamadan: 28 },
      { gender: "female", avgPeriodInRamadan: 6 }
    )
    expect(result).toBe(30)
  })
})
