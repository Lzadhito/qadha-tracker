import { useState } from "react"
import { requireOnboarded } from "~/lib/guards"
import { PRAYERS, usePrayerRemaining, useFastingRemaining } from "~/lib/queries/use-remaining"
import { PrayerCard } from "~/components/prayer/PrayerCard"
import { FastingCard } from "~/components/fasting/FastingCard"
import { FullDaySheet } from "~/components/prayer/FullDaySheet"
import { AdjustSheet } from "~/components/prayer/AdjustSheet"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Separator } from "~/components/ui/separator"

export async function clientLoader() {
  return requireOnboarded()
}

function formatDaysLeft(days: number): string | null {
  if (days <= 0) return null
  if (days >= 365) return `~${Math.round(days / 365)} years`
  if (days >= 30) return `~${Math.round(days / 30)} months`
  return `~${days} days`
}

export default function Log() {
  const prayers = usePrayerRemaining()
  const fasting = useFastingRemaining()
  const [fullDayOpen, setFullDayOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)

  const prayerRemaining = prayers.data?.reduce((s, r) => s + r.displayRemaining, 0) ?? 0
  const fastingRemaining = fasting.data?.displayRemaining ?? 0
  const loaded = !prayers.isLoading && !fasting.isLoading
  const prayerSummary = loaded ? formatDaysLeft(Math.ceil(prayerRemaining / 5)) : null
  const fastingSummary = loaded ? formatDaysLeft(fastingRemaining) : null

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
      <p className="text-muted-foreground text-sm">{today}</p>
      <h1 className="text-xl font-bold mb-4">Daily Log</h1>

      {(prayerSummary || fastingSummary) && (
        <div className="text-xs text-muted-foreground pb-1 space-y-0.5">
          {prayerSummary && <p>{prayerSummary} of prayer qadha left</p>}
          {fastingSummary && <p>{fastingSummary} of fasting qadha left</p>}
        </div>
      )}

      {!prayers.isLoading && !fasting.isLoading && (
        <div className="flex gap-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setFullDayOpen(true)}
          >
            +Qadha full day (all 5)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setAdjustOpen(true)}
          >
            Adjust remaining
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card px-4">
        {prayers.isLoading
          ? PRAYERS.map((p) => (
              <div key={p} className="py-3 border-b border-border/40 last:border-0">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          : prayers.data?.map((r) => (
              <PrayerCard
                key={r.prayer}
                prayer={r.prayer}
                remaining={r.displayRemaining}
              />
            ))}
      </div>

      <Separator className="my-4" />

      <div className="rounded-xl border border-border bg-card px-4">
        {fasting.isLoading ? (
          <div className="py-3">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-36" />
          </div>
        ) : (
          <FastingCard remaining={fastingRemaining} />
        )}
      </div>

      <FullDaySheet open={fullDayOpen} onOpenChange={setFullDayOpen} />
      <AdjustSheet
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        prayerRows={prayers.data ?? []}
        fastingRemaining={fastingRemaining}
      />
    </div>
  )
}
