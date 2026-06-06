import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "~/lib/utils"
import { PRAYERS, type Prayer } from "~/lib/queries/use-remaining"
import { getTodayDone, toggleTodayPrayer } from "~/lib/today-prayers"

const PRAYER_LABELS: Record<Prayer, string> = {
  subuh: "Subuh",
  zuhur: "Zuhur",
  asar: "Asar",
  maghrib: "Maghrib",
  isya: "Isya",
}

export function TodayTracker() {
  const [done, setDone] = useState<Set<Prayer>>(() => getTodayDone())

  const toggle = (p: Prayer) => setDone(toggleTodayPrayer(p))
  const doneCount = done.size

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Today's Prayers</p>
        <p className="text-xs text-muted-foreground">{doneCount}/5</p>
      </div>
      <div className="flex gap-2">
        {PRAYERS.map((p) => {
          const checked = done.has(p)
          return (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                checked
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Check className={cn("h-3.5 w-3.5", !checked && "opacity-20")} />
              {PRAYER_LABELS[p]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
