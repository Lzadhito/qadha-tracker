export type LocalGender = "male" | "female"

export interface LocalProfile {
  name?: string
  gender: LocalGender
  avgCycleDays?: number
  avgPeriodDays?: number
  avgPeriodInRamadan?: number
}

const KEYS = {
  name: "qadha_name",
  gender: "qadha_gender",
  avgCycleDays: "qadha_avg_cycle",
  avgPeriodDays: "qadha_avg_period",
  avgPeriodInRamadan: "qadha_avg_period_ramadan",
} as const

function parseNum(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

export function getLocalProfile(): LocalProfile {
  return {
    name: localStorage.getItem(KEYS.name) ?? undefined,
    gender: (localStorage.getItem(KEYS.gender) as LocalGender) ?? "male",
    avgCycleDays: parseNum(localStorage.getItem(KEYS.avgCycleDays)),
    avgPeriodDays: parseNum(localStorage.getItem(KEYS.avgPeriodDays)),
    avgPeriodInRamadan: parseNum(localStorage.getItem(KEYS.avgPeriodInRamadan)),
  }
}

export function saveLocalProfile(data: Partial<LocalProfile>) {
  if (data.name !== undefined) localStorage.setItem(KEYS.name, data.name)
  if (data.gender !== undefined) localStorage.setItem(KEYS.gender, data.gender)
  if (data.avgCycleDays !== undefined)
    localStorage.setItem(KEYS.avgCycleDays, String(data.avgCycleDays))
  if (data.avgPeriodDays !== undefined)
    localStorage.setItem(KEYS.avgPeriodDays, String(data.avgPeriodDays))
  if (data.avgPeriodInRamadan !== undefined)
    localStorage.setItem(KEYS.avgPeriodInRamadan, String(data.avgPeriodInRamadan))
}
