import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs"
import { PrayerPhaseCard } from "~/components/onboarding/PhaseEditor"
import type { PrayerPhaseData } from "~/components/onboarding/PhaseEditor"
import { prayerBaselineForPhase } from "~/lib/calculations"

type QuickMethod = "years" | "months" | "days" | "exact"

const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const
type Prayer = typeof PRAYERS[number]

const PRAYER_LABELS: Record<Prayer, string> = {
  subuh: "Fajr (Subuh)",
  zuhur: "Dzuhr (Zuhur)",
  asar: "Ashr (Asar)",
  maghrib: "Maghrib",
  isya: "Isha (Isya)",
}

const currentYear = new Date().getFullYear()

function newPhase(startYear: number, endYear: number): PrayerPhaseData {
  return { id: crypto.randomUUID(), startYear, endYear, pattern: "completely_missed", missedPct: 100 }
}

function getOnboardingData() {
  return JSON.parse(sessionStorage.getItem("onboarding") || "{}")
}

function getBalighYear(): number {
  const data = getOnboardingData()
  return (data.birthYear ?? currentYear - 25) + (data.balighAge ?? 15)
}

export default function Prayers() {
  const navigate = useNavigate()
  const balighYear = getBalighYear()

  // Phase mode
  const [phases, setPhases] = useState<PrayerPhaseData[]>([newPhase(balighYear, currentYear)])
  const update = (id: string, updates: Partial<PrayerPhaseData>) =>
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  const remove = (id: string) => setPhases((prev) => prev.filter((p) => p.id !== id))
  const addPhase = () => {
    const last = phases[phases.length - 1]
    setPhases((prev) => [...prev, newPhase(last ? last.endYear : balighYear, currentYear)])
  }

  // Quick mode
  const [quickMethod, setQuickMethod] = useState<QuickMethod>("years")
  const [quickValue, setQuickValue] = useState("")
  const [exact, setExact] = useState<Record<Prayer, string>>({
    subuh: "", zuhur: "", asar: "", maghrib: "", isya: "",
  })

  const data = getOnboardingData()
  const profile = { gender: data.gender ?? "male", avgPeriodDays: data.avgPeriodDays }

  // Phase totals
  const phasePerPrayer = phases.reduce((sum, p) => sum + prayerBaselineForPhase(p, profile), 0)
  const phaseTotal = phasePerPrayer * 5

  // Quick totals
  const toDays = (v: string): number => {
    const n = Math.max(0, Number(v) || 0)
    if (quickMethod === "years") return Math.round(n * 365)
    if (quickMethod === "months") return Math.round(n * 30)
    return Math.round(n)
  }
  const quickCounts: Record<Prayer, number> =
    quickMethod === "exact"
      ? { subuh: Math.max(0, Number(exact.subuh) || 0), zuhur: Math.max(0, Number(exact.zuhur) || 0), asar: Math.max(0, Number(exact.asar) || 0), maghrib: Math.max(0, Number(exact.maghrib) || 0), isya: Math.max(0, Number(exact.isya) || 0) }
      : { subuh: toDays(quickValue), zuhur: toDays(quickValue), asar: toDays(quickValue), maghrib: toDays(quickValue), isya: toDays(quickValue) }
  const quickTotal = Object.values(quickCounts).reduce((s, v) => s + v, 0)

  const handleNext = (mode: "phase" | "quick") => {
    const saved = getOnboardingData()
    if (mode === "phase") {
      saved.prayerPhases = phases
      delete saved.prayerDirectCounts
    } else {
      saved.prayerDirectCounts = quickCounts
      delete saved.prayerPhases
    }
    sessionStorage.setItem("onboarding", JSON.stringify(saved))
    navigate("/onboarding/fasting")
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Missed Prayers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose how you want to enter your missed prayers.
        </p>
      </div>

      <Tabs defaultValue="phase">
        <TabsList className="w-full">
          <TabsTrigger value="phase" className="flex-1">By life phases</TabsTrigger>
          <TabsTrigger value="quick" className="flex-1">Quick estimate</TabsTrigger>
        </TabsList>

        {/* ── Phase mode ── */}
        <TabsContent value="phase" className="space-y-3 mt-4">
          <p className="text-xs text-muted-foreground">
            Break your life into periods (e.g. school, university, work) and estimate how consistently you prayed in each.
          </p>

          {phases.map((phase, i) => (
            <PrayerPhaseCard
              key={phase.id}
              phase={phase}
              index={i}
              total={phases.length}
              onChange={update}
              onRemove={remove}
            />
          ))}

          <Button variant="outline" className="w-full" onClick={addPhase}>
            + Add phase
          </Button>

          {phaseTotal > 0 && (
            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">Estimated total</p>
              <p className="text-2xl font-bold">{phaseTotal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{phasePerPrayer.toLocaleString()} per prayer × 5</p>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/onboarding/baligh")} className="flex-1">Back</Button>
            <Button onClick={() => handleNext("phase")} className="flex-1">Next</Button>
          </div>
        </TabsContent>

        {/* ── Quick mode ── */}
        <TabsContent value="quick" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">
            Don't remember specific years? Enter a rough total directly.
          </p>

          <RadioGroup
            value={quickMethod}
            onValueChange={(v) => setQuickMethod(v as QuickMethod)}
            className="space-y-2"
          >
            {(["years", "months", "days", "exact"] as QuickMethod[]).map((v) => (
              <div key={v} className="flex items-center space-x-2">
                <RadioGroupItem value={v} id={`quick-${v}`} />
                <Label htmlFor={`quick-${v}`} className="font-normal cursor-pointer">
                  {v === "exact" ? "I know the exact count per prayer" : `I remember by ${v}`}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {quickMethod !== "exact" && (
            <div className="space-y-1">
              <Label>How many {quickMethod} of prayers did you miss?</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={quickValue}
                  onChange={(e) => setQuickValue(e.target.value)}
                  placeholder="0"
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">{quickMethod}</span>
              </div>
            </div>
          )}

          {quickMethod === "exact" && (
            <div className="space-y-3">
              {PRAYERS.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <Label className="w-36 text-sm shrink-0">{PRAYER_LABELS[p]}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={exact[p]}
                    onChange={(e) => setExact((prev) => ({ ...prev, [p]: e.target.value }))}
                    placeholder="0"
                    className="w-32"
                  />
                  <span className="text-xs text-muted-foreground">prayers</span>
                </div>
              ))}
            </div>
          )}

          {quickTotal > 0 && (
            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">Estimated total</p>
              <p className="text-2xl font-bold">{quickTotal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">prayers across all 5</p>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/onboarding/baligh")} className="flex-1">Back</Button>
            <Button onClick={() => handleNext("quick")} className="flex-1">Next</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
