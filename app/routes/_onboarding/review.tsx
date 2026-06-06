import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { supabase } from "~/lib/supabase"
import { saveLocalProfile } from "~/lib/local-profile"
import { prayerBaselineForPhase, fastingBaselineForPhase } from "~/lib/calculations"
import type { PrayerPhaseData, FastingPhaseData } from "~/components/onboarding/PhaseEditor"

const PRAYERS = ["subuh", "zuhur", "asar", "maghrib", "isya"] as const

function getOnboardingData() {
  return JSON.parse(sessionStorage.getItem("onboarding") || "{}")
}

export default function Review() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const data = getOnboardingData()
  const profile = {
    gender: (data.gender ?? "male") as "male" | "female",
    avgPeriodDays: data.avgPeriodDays,
    avgPeriodInRamadan: data.avgPeriodInRamadan,
  }

  // Prayer total — two paths: direct counts (new) or phases (legacy/settings re-run)
  const prayerDirectCounts: Record<string, number> | null = data.prayerDirectCounts ?? null
  const prayerPhases: PrayerPhaseData[] = data.prayerPhases ?? []
  const fastingPhases: FastingPhaseData[] = data.fastingPhases ?? []

  const totalPrayer = prayerDirectCounts
    ? Object.values(prayerDirectCounts).reduce((s, v) => s + v, 0)
    : prayerPhases.reduce((sum, p) => sum + prayerBaselineForPhase(p, profile), 0) * 5

  const totalFasting = fastingPhases.reduce(
    (sum, p) => sum + fastingBaselineForPhase(p, profile),
    0
  )

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate("/auth/sign-in"); return }

      const uid = session.user.id

      // All personal + phase data stays local only — not sent to DB
      saveLocalProfile({
        gender: data.gender ?? "male",
        birthYear: data.birthYear,
        balighAge: data.balighAge,
        balighCertain: data.balighCertain,
        avgCycleDays: data.avgCycleDays,
        avgPeriodDays: data.avgPeriodDays,
        avgPeriodInRamadan: data.avgPeriodInRamadan,
        prayerPhases: prayerDirectCounts ? null : prayerPhases,
        prayerDirectCounts: prayerDirectCounts ?? null,
        fastingPhases,
      })

      // 1. Upsert profile
      const { error: profileErr, data: updatedProfile } = await supabase
        .from("profiles")
        .upsert({
          user_id: uid,
          locale: "id",
          timezone: "Asia/Jakarta",
          onboarded_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select("onboarded_at")
        .single()
      if (profileErr) throw profileErr
      if (!updatedProfile?.onboarded_at) throw new Error("Profile save failed — please try again.")

      // 2. Prayer baselines — direct to ledger, no phase rows
      if (prayerDirectCounts) {
        const rows = PRAYERS
          .filter((p) => (prayerDirectCounts[p] ?? 0) > 0)
          .map((prayer) => ({
            user_id: uid,
            prayer,
            entry_type: "baseline" as const,
            amount: prayerDirectCounts[prayer],
          }))
        if (rows.length > 0) {
          const { error: ledgerErr } = await supabase.from("prayer_ledger").insert(rows)
          if (ledgerErr) throw ledgerErr
        }
      } else {
        const prayerRows = prayerPhases.flatMap((phase) => {
          const baseline = prayerBaselineForPhase(phase, profile)
          if (baseline <= 0) return []
          return PRAYERS.map((prayer) => ({
            user_id: uid,
            prayer,
            entry_type: "baseline" as const,
            amount: baseline,
          }))
        })
        if (prayerRows.length > 0) {
          const { error: ledgerErr } = await supabase.from("prayer_ledger").insert(prayerRows)
          if (ledgerErr) throw ledgerErr
        }
      }

      // 3. Fasting baselines — direct to ledger, no phase rows
      const fastingRows = fastingPhases.flatMap((phase) => {
        const baseline = fastingBaselineForPhase(phase, profile)
        if (baseline <= 0) return []
        return [{ user_id: uid, entry_type: "baseline" as const, amount: baseline }]
      })
      if (fastingRows.length > 0) {
        const { error: ledgerErr } = await supabase.from("fasting_ledger").insert(fastingRows)
        if (ledgerErr) throw ledgerErr
      }

      sessionStorage.removeItem("onboarding")
      navigate("/log")
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const prevStep = data.gender === "female" ? "/onboarding/menstruation" : "/onboarding/fasting"

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's your qadha debt.
        </p>
      </div>

      <div className="space-y-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground mb-1">Total prayer qadha</p>
          <p className="text-4xl font-bold">{totalPrayer.toLocaleString()}</p>
          {prayerDirectCounts && (
            <div className="mt-2 space-y-0.5">
              {PRAYERS.map((p) => (
                <p key={p} className="text-xs text-muted-foreground">
                  {p.charAt(0).toUpperCase() + p.slice(1)}: {(prayerDirectCounts[p] ?? 0).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted-foreground mb-1">Total fasting qadha</p>
          <p className="text-4xl font-bold">{totalFasting.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">days</p>
        </Card>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        You can adjust these later in Settings.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(prevStep)} className="flex-1" disabled={loading}>
          Adjust
        </Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={loading}>
          {loading ? "Saving..." : "Looks right — start"}
        </Button>
      </div>
    </div>
  )
}
