import { describe, it, expect } from "vitest"
import { anchorForClock } from "./anchor"

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
