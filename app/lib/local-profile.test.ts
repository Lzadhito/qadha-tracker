import { describe, it, expect } from "vitest"
import { getLocalProfile, saveLocalProfile } from "./local-profile"

describe("getLocalProfile", () => {
  it("returns defaults when localStorage is empty", () => {
    const p = getLocalProfile()
    expect(p.gender).toBe("male")
    expect(p.name).toBeUndefined()
    expect(p.avgCycleDays).toBeUndefined()
    expect(p.avgPeriodDays).toBeUndefined()
    expect(p.avgPeriodInRamadan).toBeUndefined()
  })
})

describe("saveLocalProfile + getLocalProfile", () => {
  it("persists all fields", () => {
    saveLocalProfile({
      name: "Ali",
      gender: "female",
      avgCycleDays: 28,
      avgPeriodDays: 6,
      avgPeriodInRamadan: 5,
    })
    const p = getLocalProfile()
    expect(p.name).toBe("Ali")
    expect(p.gender).toBe("female")
    expect(p.avgCycleDays).toBe(28)
    expect(p.avgPeriodDays).toBe(6)
    expect(p.avgPeriodInRamadan).toBe(5)
  })

  it("partial save does not overwrite unset fields", () => {
    saveLocalProfile({ name: "Budi" })
    saveLocalProfile({ gender: "female" })
    const p = getLocalProfile()
    expect(p.name).toBe("Budi")
    expect(p.gender).toBe("female")
  })

  it("gender defaults to male when not saved", () => {
    saveLocalProfile({ name: "Siti" })
    expect(getLocalProfile().gender).toBe("male")
  })
})
