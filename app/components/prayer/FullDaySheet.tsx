import { useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
    if (!range?.from) return t("fullDay.selectDates")
    if (!range.to || format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
      return t("fullDay.logFor", { date: format(range.from, "d MMM yyyy") })
    }
    return t("fullDay.logRange", { from: format(range.from, "d MMM"), to: format(range.to, "d MMM yyyy"), count: days.length })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{t("fullDay.title")}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          <p className="text-xs text-muted-foreground">
            {t("fullDay.desc")}
          </p>
          <Button className="w-full" onClick={() => logDays()} disabled={log.isPending}>
            {t("fullDay.todayNow")}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">{t("fullDay.orChooseDates")}</span>
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
