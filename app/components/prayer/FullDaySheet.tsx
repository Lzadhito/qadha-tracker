import { useState } from "react"
import { format, eachDayOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { usePrayerFullDayLog } from "~/lib/queries/use-log-mutation"

interface FullDaySheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function FullDaySheet({ open, onOpenChange }: FullDaySheetProps) {
  const [range, setRange] = useState<DateRange | undefined>()
  const log = usePrayerFullDayLog()

  const days = range?.from
    ? eachDayOfInterval({ start: range.from, end: range.to ?? range.from })
    : []

  const logDays = (dates?: DateRange) => {
    let loggedDates: string[] | undefined
    if (dates?.from) {
      const dayList = eachDayOfInterval({ start: dates.from, end: dates.to ?? dates.from })
      loggedDates = dayList.map((d) => {
        const local = new Date(d)
        local.setHours(12, 0, 0, 0)
        return local.toISOString()
      })
    }
    log.mutate({ loggedDates }, {
      onSuccess: () => {
        onOpenChange(false)
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Log full day — all 5 prayers</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          <p className="text-xs text-muted-foreground">
            Logs 1 qadha for Fajr, Dzuhr, Ashr, Maghrib, and Isha for each selected day.
          </p>
          <Button className="w-full" onClick={() => logDays()} disabled={log.isPending}>
            Today (right now)
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
            onClick={() => range?.from && logDays(range)}
          >
            {rangeLabel()}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
