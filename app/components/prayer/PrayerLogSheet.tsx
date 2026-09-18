import { useState } from "react"
import { useTranslation } from "react-i18next"
import { format, eachDayOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "~/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Calendar } from "~/components/ui/calendar"
import { logPrayer } from "~/lib/log-actions"
import type { Prayer } from "~/lib/queries/use-remaining"

interface PrayerLogSheetProps {
  prayer: Prayer
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Lazy-loaded (calendar + dialog) and shared by all prayer cards.
export function PrayerLogSheet({ prayer, open, onOpenChange }: PrayerLogSheetProps) {
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRange | undefined>()
  const prayerName = t(`prayers.${prayer}`)

  const days = range?.from
    ? eachDayOfInterval({ start: range.from, end: range.to ?? range.from })
    : []

  const close = () => {
    onOpenChange(false)
    setRange(undefined)
  }

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
    logPrayer(prayer, loggedDates)
    close()
  }

  const rangeLabel = () => {
    if (!range?.from) return t("prayerCard.selectDates")
    if (!range.to || format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
      return t("prayerCard.logFor", { date: format(range.from, "d MMM yyyy") })
    }
    return t("prayerCard.logRange", { from: format(range.from, "d MMM"), to: format(range.to, "d MMM yyyy"), count: days.length })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{t("prayerCard.whenDidYou", { prayer: prayerName })}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          <p className="text-xs text-muted-foreground">
            {t("prayerCard.selectOrDrag")}
          </p>
          <Button className="w-full" onClick={() => logQadha()}>
            {t("common.rightNow")}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">{t("prayerCard.orChooseDates")}</span>
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
            disabled={!range?.from}
            onClick={() => range?.from && logQadha(range)}
          >
            {rangeLabel()}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
