import { useState } from "react"
import { useTranslation } from "react-i18next"
import { format, isSameDay, eachDayOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { useLogRemainingToday } from "~/lib/queries/use-log-mutation"
import { PRAYERS, getRemainingPrayers, resolveExclude, useDatePrayerLog, wibDateStr } from "~/lib/queries/use-remaining"
import type { Prayer } from "~/lib/queries/use-remaining"

interface RemainingSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  todayDone: Set<Prayer>
}

function formatDate(d: Date) {
  return format(d, "yyyy-MM-dd")
}

export function RemainingSheet({ open, onOpenChange, todayDone }: RemainingSheetProps) {
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRange | undefined>()
  const log = useLogRemainingToday()

  // Determine if a single past date is selected
  const singleFrom = range?.from
  const singleTo = range?.to
  const isSingleDate = singleFrom && (!singleTo || isSameDay(singleFrom, singleTo))
  const isToday = isSingleDate && formatDate(singleFrom) === wibDateStr()

  // For single past date, fetch what's already logged on that date
  const pickedDateKey = isSingleDate && !isToday ? formatDate(singleFrom) : null
  const dateLog = useDatePrayerLog(pickedDateKey)

  const exclude = resolveExclude({
    rangeFrom: range?.from,
    rangeTo: range?.to,
    todayKey: wibDateStr(),
    todayDone,
    fetchedDone: dateLog.data,
  })

  const remaining = getRemainingPrayers(exclude)
  const remainingCount = isSingleDate ? remaining.length : PRAYERS.length

  const isLoading = !!pickedDateKey && dateLog.isLoading

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
    log.mutate({ exclude, loggedDates }, {
      onSuccess: () => {
        onOpenChange(false)
        setRange(undefined)
      },
    })
  }

  const rangeLabel = () => {
    if (!range?.from) return t("remaining.selectDates")
    if (isSingleDate) {
      return t("remaining.logForDate", { count: remainingCount, date: format(range.from, "d MMM yyyy") })
    }
    const dayCount = eachDayOfInterval({ start: range.from, end: range.to ?? range.from }).length
    return t("remaining.logAllRange", { from: format(range.from, "d MMM"), to: format(range.to!, "d MMM yyyy"), count: dayCount })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setRange(undefined) }}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>
            {t("remaining.title", { count: remainingCount })}
          </SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          {!range?.from && (
            <Button className="w-full" onClick={() => logDays()} disabled={log.isPending}>
              {t("remaining.rightNowToday", { count: getRemainingPrayers(todayDone).length })}
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">{t("remaining.orPickDate")}</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={(d) => d > new Date()}
            className="mx-auto"
          />
          {range?.from && (
            <>
              {isLoading && (
                <p className="text-xs text-muted-foreground text-center">{t("remaining.checking")}</p>
              )}
              {!isLoading && isSingleDate && remainingCount === 0 && (
                <p className="text-xs text-muted-foreground text-center">{t("remaining.allLogged")}</p>
              )}
              {!isLoading && (remainingCount > 0 || !isSingleDate) && (
                <Button
                  className="w-full"
                  disabled={log.isPending || isLoading}
                  onClick={() => logDays(range)}
                >
                  {rangeLabel()}
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
