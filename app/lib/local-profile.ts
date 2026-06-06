export type LocalGender = "male" | "female"

export interface LocalProfile {
  name?: string
  gender: LocalGender
  birthYear?: number
  balighAge?: number
  balighCertain?: boolean
  avgCycleDays?: number
  avgPeriodDays?: number
  avgPeriodInRamadan?: number
  prayerPhases?: unknown[] | null
  prayerDirectCounts?: Record<string, number> | null
  fastingPhases?: unknown[] | null
}

const KEYS = {
  name: "qadha_name",
  gender: "qadha_gender",
  birthYear: "qadha_birth_year",
  balighAge: "qadha_baligh_age",
  balighCertain: "qadha_baligh_certain",
  avgCycleDays: "qadha_avg_cycle",
  avgPeriodDays: "qadha_avg_period",
  avgPeriodInRamadan: "qadha_avg_period_ramadan",
  prayerPhases: "qadha_prayer_phases",
  prayerDirectCounts: "qadha_prayer_direct_counts",
  fastingPhases: "qadha_fasting_phases",
} as const

function parseNum(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

function parseJson<T>(v: string | null): T | null {
  if (!v) return null
  try { return JSON.parse(v) as T } catch { return null }
}

export function getLocalProfile(): LocalProfile {
  const balighCertainRaw = localStorage.getItem(KEYS.balighCertain)
  return {
    name: localStorage.getItem(KEYS.name) ?? undefined,
    gender: (localStorage.getItem(KEYS.gender) as LocalGender) ?? "male",
    birthYear: parseNum(localStorage.getItem(KEYS.birthYear)),
    balighAge: parseNum(localStorage.getItem(KEYS.balighAge)),
    balighCertain: balighCertainRaw === null ? undefined : balighCertainRaw === "true",
    avgCycleDays: parseNum(localStorage.getItem(KEYS.avgCycleDays)),
    avgPeriodDays: parseNum(localStorage.getItem(KEYS.avgPeriodDays)),
    avgPeriodInRamadan: parseNum(localStorage.getItem(KEYS.avgPeriodInRamadan)),
    prayerPhases: parseJson<unknown[]>(localStorage.getItem(KEYS.prayerPhases)),
    prayerDirectCounts: parseJson<Record<string, number>>(localStorage.getItem(KEYS.prayerDirectCounts)),
    fastingPhases: parseJson<unknown[]>(localStorage.getItem(KEYS.fastingPhases)),
  }
}

export function saveLocalProfile(data: Partial<LocalProfile>) {
  if (data.name !== undefined) localStorage.setItem(KEYS.name, data.name)
  if (data.gender !== undefined) localStorage.setItem(KEYS.gender, data.gender)
  if (data.birthYear !== undefined)
    localStorage.setItem(KEYS.birthYear, String(data.birthYear))
  if (data.balighAge !== undefined)
    localStorage.setItem(KEYS.balighAge, String(data.balighAge))
  if (data.balighCertain !== undefined)
    localStorage.setItem(KEYS.balighCertain, String(data.balighCertain))
  if (data.avgCycleDays !== undefined)
    localStorage.setItem(KEYS.avgCycleDays, String(data.avgCycleDays))
  if (data.avgPeriodDays !== undefined)
    localStorage.setItem(KEYS.avgPeriodDays, String(data.avgPeriodDays))
  if (data.avgPeriodInRamadan !== undefined)
    localStorage.setItem(KEYS.avgPeriodInRamadan, String(data.avgPeriodInRamadan))
  if (data.prayerPhases !== undefined)
    localStorage.setItem(KEYS.prayerPhases, JSON.stringify(data.prayerPhases))
  if (data.prayerDirectCounts !== undefined)
    localStorage.setItem(KEYS.prayerDirectCounts, JSON.stringify(data.prayerDirectCounts))
  if (data.fastingPhases !== undefined)
    localStorage.setItem(KEYS.fastingPhases, JSON.stringify(data.fastingPhases))
}
