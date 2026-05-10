// Prayer + fasting baseline + ETA calculations per PRD §11

export interface PrayerPhase {
  startYear: number
  endYear: number
  missedPct: number
}

export interface FastingPhase {
  startYear: number
  endYear: number
  pattern:
    | "all_fasted"
    | "few_missed"
    | "half"
    | "few_fasted"
    | "none_fasted"
    | "custom"
  daysMissedPerRamadan: number
}

export interface Profile {
  gender: "male" | "female"
  avgPeriodDays?: number
  avgPeriodInRamadan?: number
}

export function prayerBaselineForPhase(
  phase: PrayerPhase,
  profile: Profile
): number {
  const years = phase.endYear - phase.startYear + 1
  const daysGross = years * 365

  // Menstruation: NOT counted for prayer (exempted entirely)
  const menstruationDays =
    profile.gender === "female" && profile.avgPeriodDays
      ? years * 12 * profile.avgPeriodDays
      : 0

  const eligibleDays = daysGross - menstruationDays
  return Math.round(eligibleDays * (phase.missedPct / 100))
}

export function fastingBaselineForPhase(
  phase: FastingPhase,
  profile: Profile
): number {
  const ramadans = phase.endYear - phase.startYear + 1
  let perRamadan = phase.daysMissedPerRamadan

  // Menstruation: COUNTED for fasting (must be made up).
  const includesMenstruationImplicitly = [
    "half",
    "few_fasted",
    "none_fasted",
    "custom",
  ].includes(phase.pattern)

  if (
    profile.gender === "female" &&
    profile.avgPeriodInRamadan &&
    !includesMenstruationImplicitly
  ) {
    perRamadan += profile.avgPeriodInRamadan
  }

  return Math.min(ramadans * perRamadan, ramadans * 30)
}

