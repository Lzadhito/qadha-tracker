import { describe, it, expect } from "vitest"
import { wibDateKey, wibNoonIso, wibYesterdayKey } from "./wib"

describe("wibYesterdayKey", () => {
  it("steps back one WIB day", () => {
    expect(wibYesterdayKey(new Date("2026-06-07T10:00:00Z"))).toBe("2026-06-06")
  })

  it("uses the WIB day, not the UTC day, across the boundary", () => {
    // 18:00Z is already 01:00 on the 8th in WIB, so yesterday is the 7th.
    expect(wibYesterdayKey(new Date("2026-06-07T18:00:00Z"))).toBe("2026-06-07")
  })

  it("crosses month boundaries", () => {
    expect(wibYesterdayKey(new Date("2026-03-01T05:00:00Z"))).toBe("2026-02-28")
  })
})

describe("wibNoonIso", () => {
  it("stamps noon WIB and stays in the same WIB day", () => {
    expect(wibNoonIso("2026-06-06")).toBe("2026-06-06T05:00:00.000Z")
    expect(wibDateKey(new Date(wibNoonIso("2026-06-06")))).toBe("2026-06-06")
  })
})
