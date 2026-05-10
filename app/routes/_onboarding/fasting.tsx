import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { FastingPhaseCard } from "~/components/onboarding/PhaseEditor"
import type { FastingPhaseData } from "~/components/onboarding/PhaseEditor"
import { fastingBaselineForPhase } from "~/lib/calculations"

const currentYear = new Date().getFullYear()

function newPhase(startYear: number, endYear: number): FastingPhaseData {
  return {
    id: crypto.randomUUID(),
    startYear,
    endYear,
    pattern: "none_fasted",
    daysMissedPerRamadan: 30,
  }
}

function getOnboardingData() {
  return JSON.parse(sessionStorage.getItem("onboarding") || "{}")
}

export default function Fasting() {
  const navigate = useNavigate()
  const data = getOnboardingData()
  const balighYear = (data.birthYear ?? currentYear - 25) + (data.balighAge ?? 15)
  const fastingStart = data.fastingStartAge
    ? (data.birthYear ?? currentYear - 25) + data.fastingStartAge
    : balighYear

  const [phases, setPhases] = useState<FastingPhaseData[]>([
    newPhase(fastingStart, currentYear),
  ])

  const update = (id: string, updates: Partial<FastingPhaseData>) =>
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))

  const remove = (id: string) =>
    setPhases((prev) => prev.filter((p) => p.id !== id))

  const addPhase = () => {
    const last = phases[phases.length - 1]
    const startYear = last ? last.endYear : fastingStart
    setPhases((prev) => [...prev, newPhase(startYear, currentYear)])
  }

  const profile = {
    gender: data.gender ?? "male",
    avgPeriodInRamadan: data.avgPeriodInRamadan,
  }

  const totalDays = phases.reduce(
    (sum, p) => sum + fastingBaselineForPhase(p, profile),
    0
  )

  const handleNext = () => {
    const saved = getOnboardingData()
    saved.fastingPhases = phases
    sessionStorage.setItem("onboarding", JSON.stringify(saved))
    navigate(data.gender === "female" ? "/onboarding/menstruation" : "/onboarding/review")
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Fasting Phases</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How many Ramadan days did you miss per year?
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase, i) => (
          <FastingPhaseCard
            key={phase.id}
            phase={phase}
            index={i}
            total={phases.length}
            onChange={update}
            onRemove={remove}
          />
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={addPhase}>
        + Add phase
      </Button>

      {totalDays > 0 && (
        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">Estimated total</p>
          <p className="text-2xl font-bold">{totalDays.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">days of fasting to make up</p>
        </Card>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => navigate("/onboarding/prayers")} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  )
}
