import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { requireOnboarded } from "~/lib/guards"
import { supabase } from "~/lib/supabase"
import { prayerBaselineForPhase, fastingBaselineForPhase } from "~/lib/calculations"
import { PrayerPhaseCard, FastingPhaseCard } from "~/components/onboarding/PhaseEditor"
import type { PrayerPhaseData, FastingPhaseData } from "~/components/onboarding/PhaseEditor"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { toast } from "sonner"

const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const
const currentYear = new Date().getFullYear()

export async function clientLoader() {
  return requireOnboarded()
}

function newPrayerPhase(start: number): PrayerPhaseData {
  return { id: crypto.randomUUID(), startYear: start, endYear: currentYear, pattern: "completely_missed", missedPct: 100 }
}

function newFastingPhase(start: number): FastingPhaseData {
  return { id: crypto.randomUUID(), startYear: start, endYear: currentYear, pattern: "none_fasted", daysMissedPerRamadan: 30 }
}

export default function Phases() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prayerPhases, setPrayerPhases] = useState<PrayerPhaseData[]>([])
  const [fastingPhases, setFastingPhases] = useState<FastingPhaseData[]>([])
  const [profile, setProfile] = useState<{ gender: "male" | "female"; avgPeriodDays?: number; avgPeriodInRamadan?: number; balighAge: number; birthYear: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [{ data: prof }, { data: pp }, { data: fp }] = await Promise.all([
        supabase.from("profiles").select("gender,avg_period_days,avg_period_in_ramadan,baligh_age,birth_year").eq("user_id", session.user.id).single(),
        supabase.from("prayer_phases").select("*").eq("user_id", session.user.id).order("start_year"),
        supabase.from("fasting_phases").select("*").eq("user_id", session.user.id).order("start_year"),
      ])

      if (prof) {
        setProfile({ gender: prof.gender as "male" | "female", avgPeriodDays: prof.avg_period_days ?? undefined, avgPeriodInRamadan: prof.avg_period_in_ramadan ?? undefined, balighAge: prof.baligh_age, birthYear: prof.birth_year })
      }

      const balighYear = prof ? prof.birth_year + prof.baligh_age : currentYear - 10

      setPrayerPhases(
        pp?.length
          ? pp.map((p) => ({ id: p.id, startYear: p.start_year, endYear: p.end_year, pattern: p.pattern as PrayerPhaseData["pattern"], missedPct: p.missed_pct }))
          : [newPrayerPhase(balighYear)]
      )
      setFastingPhases(
        fp?.length
          ? fp.map((p) => ({ id: p.id, startYear: p.start_year, endYear: p.end_year, pattern: p.pattern as FastingPhaseData["pattern"], daysMissedPerRamadan: p.days_missed_per_ramadan }))
          : [newFastingPhase(balighYear)]
      )
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id

      // Delete all existing baseline entries + phases
      await Promise.all([
        supabase.from("prayer_ledger").delete().eq("user_id", uid).eq("entry_type", "baseline"),
        supabase.from("fasting_ledger").delete().eq("user_id", uid).eq("entry_type", "baseline"),
        supabase.from("prayer_phases").delete().eq("user_id", uid),
        supabase.from("fasting_phases").delete().eq("user_id", uid),
      ])

      // Re-insert prayer phases + baselines
      for (const phase of prayerPhases) {
        const { data: inserted, error } = await supabase.from("prayer_phases").insert({ user_id: uid, start_year: phase.startYear, end_year: phase.endYear, pattern: phase.pattern, missed_pct: phase.missedPct }).select("id").single()
        if (error) throw error
        const baseline = prayerBaselineForPhase(phase, profile)
        if (baseline > 0) {
          await supabase.from("prayer_ledger").insert(PRAYERS.map((prayer) => ({ user_id: uid, prayer, entry_type: "baseline", amount: baseline, source_phase_id: inserted.id })))
        }
      }

      // Re-insert fasting phases + baselines
      for (const phase of fastingPhases) {
        const { data: inserted, error } = await supabase.from("fasting_phases").insert({ user_id: uid, start_year: phase.startYear, end_year: phase.endYear, pattern: phase.pattern, days_missed_per_ramadan: phase.daysMissedPerRamadan }).select("id").single()
        if (error) throw error
        const baseline = fastingBaselineForPhase(phase, profile)
        if (baseline > 0) {
          await supabase.from("fasting_ledger").insert({ user_id: uid, entry_type: "baseline", amount: baseline, source_phase_id: inserted.id })
        }
      }

      toast.success("Phases updated.")
      navigate("/settings")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save phases.")
    } finally {
      setSaving(false)
    }
  }

  const balighYear = profile ? profile.birthYear + profile.balighAge : currentYear - 10

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="mb-4">← Back</Button>
        <h1 className="text-xl font-bold">Edit Phases</h1>
        <p className="text-muted-foreground text-sm mt-1">Changes recalculate your baseline. Your logged qadha/misses are preserved.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}</div>
      ) : (
        <>
          <div>
            <h2 className="font-semibold text-sm mb-3">Prayer phases</h2>
            <div className="space-y-3">
              {prayerPhases.map((p, i) => (
                <PrayerPhaseCard key={p.id} phase={p} index={i} total={prayerPhases.length}
                  onChange={(id, u) => setPrayerPhases((prev) => prev.map((x) => x.id === id ? { ...x, ...u } : x))}
                  onRemove={(id) => setPrayerPhases((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full"
              onClick={() => { const last = prayerPhases[prayerPhases.length - 1]; setPrayerPhases((p) => [...p, newPrayerPhase(last ? last.endYear : balighYear)]) }}>
              + Add phase
            </Button>
          </div>

          <div>
            <h2 className="font-semibold text-sm mb-3">Fasting phases</h2>
            <div className="space-y-3">
              {fastingPhases.map((p, i) => (
                <FastingPhaseCard key={p.id} phase={p} index={i} total={fastingPhases.length}
                  onChange={(id, u) => setFastingPhases((prev) => prev.map((x) => x.id === id ? { ...x, ...u } : x))}
                  onRemove={(id) => setFastingPhases((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full"
              onClick={() => { const last = fastingPhases[fastingPhases.length - 1]; setFastingPhases((p) => [...p, newFastingPhase(last ? last.endYear : balighYear)]) }}>
              + Add phase
            </Button>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save & recalculate"}
          </Button>
        </>
      )}
    </div>
  )
}
