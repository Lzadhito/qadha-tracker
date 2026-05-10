import { requireOnboarded } from "~/lib/guards"
import { PRAYERS, usePrayerRemaining, useFastingRemaining } from "~/lib/queries/use-remaining"
import { PrayerCard } from "~/components/prayer/PrayerCard"
import { FastingCard } from "~/components/fasting/FastingCard"
import { Skeleton } from "~/components/ui/skeleton"
import { Separator } from "~/components/ui/separator"

export async function clientLoader() {
  return requireOnboarded()
}

function formatQadhaLeft(prayerRemaining: number, fastingRemaining: number): string | null {
  if (prayerRemaining <= 0 && fastingRemaining <= 0) return null
  const totalDays = Math.ceil(prayerRemaining / 5) + fastingRemaining
  if (totalDays >= 365) return `~${Math.round(totalDays / 365)} years of qadha left`
  if (totalDays >= 30) return `~${Math.round(totalDays / 30)} months of qadha left`
  return `~${totalDays} days of qadha left`
}

export default function Log() {
  const prayers = usePrayerRemaining()
  const fasting = useFastingRemaining()

  const prayerRemaining = prayers.data?.reduce((s, r) => s + r.displayRemaining, 0) ?? 0
  const fastingRemaining = fasting.data?.displayRemaining ?? 0
  const summary = !prayers.isLoading && !fasting.isLoading
    ? formatQadhaLeft(prayerRemaining, fastingRemaining)
    : null

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
      <p className="text-muted-foreground text-sm">{today}</p>
      <h1 className="text-xl font-bold mb-4">Daily Log</h1>

      {summary && (
        <p className="text-xs text-muted-foreground pb-2">{summary}</p>
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
          <FastingCard remaining={fasting.data?.displayRemaining ?? 0} />
        )}
      </div>
    </div>
  )
}
