import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Separator } from "~/components/ui/separator"
import { usePrayerAdjust, useFastingAdjust } from "~/lib/queries/use-log-mutation"
import { PRAYERS } from "~/lib/queries/use-remaining"
import type { Prayer } from "~/lib/queries/use-remaining"

const PRAYER_LABELS: Record<Prayer, string> = {
  subuh: "Fajr (Subuh)",
  zuhur: "Dzuhr (Zuhur)",
  asar: "Ashr (Asar)",
  maghrib: "Maghrib",
  isya: "Isha (Isya)",
}

interface PrayerRow { prayer: Prayer; displayRemaining: number }

interface AdjustSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  prayerRows: PrayerRow[]
  fastingRemaining: number
}

export function AdjustSheet({ open, onOpenChange, prayerRows, fastingRemaining }: AdjustSheetProps) {
  const [prayerValues, setPrayerValues] = useState<Record<Prayer, string>>({
    subuh: "", zuhur: "", asar: "", maghrib: "", isya: "",
  })
  const [fastingValue, setFastingValue] = useState("")
  const [addDays, setAddDays] = useState("")

  const prayerAdjust = usePrayerAdjust()
  const fastingAdjust = useFastingAdjust()

  useEffect(() => {
    if (open) {
      const vals = {} as Record<Prayer, string>
      for (const row of prayerRows) vals[row.prayer] = String(row.displayRemaining)
      setPrayerValues(vals)
      setFastingValue(String(fastingRemaining))
      setAddDays("")
    }
  }, [open, prayerRows, fastingRemaining])

  const handleAddDays = async () => {
    const days = Math.max(0, Number(addDays) || 0)
    if (days === 0) return
    await prayerAdjust.mutateAsync({
      adjustments: PRAYERS.map((prayer) => ({ prayer, delta: days })),
    })
    setAddDays("")
  }

  const handleSave = async () => {
    const prayerAdjustments = PRAYERS
      .map((p) => ({
        prayer: p,
        delta: (Number(prayerValues[p]) || 0) - (prayerRows.find((r) => r.prayer === p)?.displayRemaining ?? 0),
      }))
      .filter((a) => a.delta !== 0)

    const fastingDelta = (Number(fastingValue) || 0) - fastingRemaining

    const promises: Promise<unknown>[] = []
    if (prayerAdjustments.length > 0) {
      promises.push(prayerAdjust.mutateAsync({ adjustments: prayerAdjustments }))
    }
    if (fastingDelta !== 0) {
      promises.push(fastingAdjust.mutateAsync({ delta: fastingDelta }))
    }

    if (promises.length === 0) { onOpenChange(false); return }

    await Promise.all(promises)
    onOpenChange(false)
  }

  const isPending = prayerAdjust.isPending || fastingAdjust.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Adjust remaining qadha</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-4 px-4">
          <p className="text-xs text-muted-foreground">
            Change the count directly. The difference is recorded as an adjustment in your history.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add days to all prayers</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={addDays}
                onChange={(e) => setAddDays(e.target.value)}
                placeholder="0"
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">days</span>
              <Button size="sm" onClick={handleAddDays} disabled={isPending || !addDays || Number(addDays) <= 0}>
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Adds this count to each of the 5 prayers.</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Set exact remaining per prayer</p>
            {PRAYERS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <Label className="w-36 text-sm shrink-0">{PRAYER_LABELS[p]}</Label>
                <Input
                  type="number"
                  min={0}
                  value={prayerValues[p]}
                  onChange={(e) => setPrayerValues((prev) => ({ ...prev, [p]: e.target.value }))}
                  className="w-28"
                />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fasting</p>
            <div className="flex items-center gap-3">
              <Label className="w-36 text-sm shrink-0">Days remaining</Label>
              <Input
                type="number"
                min={0}
                value={fastingValue}
                onChange={(e) => setFastingValue(e.target.value)}
                className="w-28"
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save adjustments"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
