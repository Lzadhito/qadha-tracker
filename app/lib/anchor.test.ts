import { describe, it, expect } from "vitest"
import { anchorForClock, resolveAnchor } from "./anchor"

const at = (h: number, m = 0) => new Date(2026, 5, 7, h, m)

describe("anchorForClock", () => {
  it("maps each slot, including its boundaries", () => {
    expect(anchorForClock(at(3, 59))).toBe("isya")
    expect(anchorForClock(at(4, 0))).toBe("subuh")
    expect(anchorForClock(at(10, 59))).toBe("subuh")
    expect(anchorForClock(at(11, 0))).toBe("zuhur")
    expect(anchorForClock(at(14, 29))).toBe("zuhur")
    expect(anchorForClock(at(14, 30))).toBe("asar")
    expect(anchorForClock(at(17, 30))).toBe("maghrib")
    expect(anchorForClock(at(19, 0))).toBe("isya")
    expect(anchorForClock(at(23, 59))).toBe("isya")
  })
})

describe("resolveAnchor", () => {
  it("follows the clock with no pick", () => {
    expect(resolveAnchor(at(18), null)).toBe("maghrib")
  })

  it("keeps a manual pick while the clock stays in the same slot", () => {
    const pick = { anchor: "zuhur" as const, slot: anchorForClock(at(13)) }
    expect(resolveAnchor(at(14), pick)).toBe("zuhur")
  })

  it("drops a manual pick once the clock moves to another slot", () => {
    const pick = { anchor: "zuhur" as const, slot: anchorForClock(at(13)) }
    expect(resolveAnchor(at(15), pick)).toBe("asar")
  })
})
