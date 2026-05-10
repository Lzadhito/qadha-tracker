import { useState } from "react"
import { format, eachDayOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CheckCircle2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Calendar } from "~/components/ui/calendar"
import { usePrayerLog } from "~/lib/queries/use-log-mutation"
import type { Prayer } from "~/lib/queries/use-remaining"

const PRAYER_LABELS: Record<Prayer, string> = {
  subuh: "Subuh",
  zuhur: "Zuhur",
  asar: "Asar",
  maghrib: "Maghrib",
  isya: "Isya",
}

interface PrayerCardProps {
  prayer: Prayer
  remaining: number
  loggedToday: boolean
}

export function PrayerCard({ prayer, remaining, loggedToday }: PrayerCardProps) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>()
  const log = usePrayerLog()

  const days = range?.from
    ? eachDayOfInterval({ start: range.from, end: range.to ?? range.from })
    : []

  const logQadha = (dates?: DateRange) => {
    let loggedDates: string[] | undefined
    if (dates?.from) {
      const dayList = eachDayOfInterval({ start: dates.from, end: dates.to ?? dates.from })
      loggedDates = dayList.map((d) => {
        const local = new Date(d)
        local.setHours(12, 0, 0, 0)
        return local.toISOString()
      })
    }
    log.mutate({ prayer, loggedDates }, {
      onSuccess: () => {
        setOpen(false)
        setRange(undefined)
      },
    })
  }

  const rangeLabel = () => {
    if (!range?.from) return "Select date(s) above"
    if (!range.to || format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
      return `Log for ${format(range.from, "d MMM yyyy")}`
    }
    return `Log ${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")} (${days.length} days)`
  }

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{PRAYER_LABELS[prayer]}</p>
        <p className="text-muted-foreground text-xs">
          {remaining > 0 ? `${remaining.toLocaleString()} remaining` : "All paid off"}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {loggedToday && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Today
          </span>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            size="sm"
            variant={remaining <= 0 ? "outline" : "default"}
            disabled={log.isPending}
            className="h-9 min-w-[80px]"
            onClick={() => setOpen(true)}
          >
            +Qadha
          </Button>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>When did you qadha {PRAYER_LABELS[prayer]}?</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-3 px-4">
              <p className="text-xs text-muted-foreground">
                Select a single day or drag to pick a range.
              </p>
              <Button className="w-full" onClick={() => logQadha()} disabled={log.isPending}>
                Right now
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">or choose date(s)</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                disabled={(d) => d > new Date()}
                className="mx-auto"
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={!range?.from || log.isPending}
                onClick={() => range?.from && logQadha(range)}
              >
                {rangeLabel()}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
