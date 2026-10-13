import { useState } from "react"
import { useTranslation } from "react-i18next"
import { eachDayOfInterval, format } from "date-fns"
import { Check } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { logPrayers } from "~/lib/log-actions"
import { PRAYERS, getRemainingPrayers, useDatePrayerLog, type Prayer } from "~/lib/queries/use-remaining"
import { wibDateKey, wibNoonIso, wibYesterdayKey } from "~/lib/wib"

interface DayLogSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  // Today's log comes from the always-fresh cache, so today works offline without a fetch.
  todayDone: Set<Prayer>
}

// Day(s) first, prayers second: "yesterday I did Dhuhr and Asr", or all five over a whole range
// of days, in one sheet and one save.
export function DayLogSheet({ open, onOpenChange, todayDone }: DayLogSheetProps) {
  const { t } = useTranslation()
  const [range, setRange] = useState(() => ({ from: wibYesterdayKey(), to: wibYesterdayKey() }))
  const [selected, setSelected] = useState<Set<Prayer>>(new Set())
  const [showCalendar, setShowCalendar] = useState(false)

  const todayKey = wibDateKey()
  const [y, m, d] = range.from.split("-").map(Number)
  const [y2, m2, d2] = range.to.split("-").map(Number)
  const dayKeys = eachDayOfInterval({ start: new Date(y, m - 1, d), end: new Date(y2, m2 - 1, d2) }).map(
    (day) => format(day, "yyyy-MM-dd")
  )
  const multiDay = dayKeys.length > 1
  // Only a single day can show what is already logged; over a range every selected prayer is logged.
  const isToday = !multiDay && range.from === todayKey
  const dateLog = useDatePrayerLog(multiDay || isToday ? null : range.from)
  const loading = !multiDay && !isToday && dateLog.data === undefined
  const logged = multiDay ? new Set<Prayer>() : isToday ? todayDone : (dateLog.data ?? new Set<Prayer>())

  const pickDays = (from: string, to = from) => {
    setRange({ from, to })
    setSelected(new Set())
  }

  const toggle = (prayer: Prayer) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (!next.delete(prayer)) next.add(prayer)
      return next
    })

  const close = (v: boolean) => {
    onOpenChange(v)
    if (!v) {
      setRange({ from: wibYesterdayKey(), to: wibYesterdayKey() })
      setSelected(new Set())
      setShowCalendar(false)
    }
  }

  const save = () => {
    const prayers = PRAYERS.filter((p) => selected.has(p) && !logged.has(p))
    logPrayers(prayers, isToday ? undefined : dayKeys.map(wibNoonIso))
    close(false)
  }

  const count = PRAYERS.filter((p) => selected.has(p) && !logged.has(p)).length

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{t("dayLog.title")}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          <div className="flex gap-2">
            <Button
              variant={!multiDay && range.from === todayKey ? "default" : "outline"}
              className="flex-1"
              onClick={() => pickDays(todayKey)}
            >
              {t("prayerCard.today")}
            </Button>
            <Button
              variant={!multiDay && range.from === wibYesterdayKey() ? "default" : "outline"}
              className="flex-1"
              onClick={() => pickDays(wibYesterdayKey())}
            >
              {t("prayerCard.yesterday")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowCalendar((v) => !v)}>
              {t("dayLog.otherDate")}
            </Button>
          </div>
          {showCalendar && (
            <Calendar
              mode="range"
              selected={{ from: new Date(y, m - 1, d), to: new Date(y2, m2 - 1, d2) }}
              onSelect={(r) => r?.from && pickDays(format(r.from, "yyyy-MM-dd"), format(r.to ?? r.from, "yyyy-MM-dd"))}
              disabled={(date) => date > new Date()}
              className="mx-auto"
            />
          )}

          <p className="text-xs text-muted-foreground">
            {loading
              ? t("dayLog.checking")
              : multiDay
                ? t("dayLog.pickRange", { from: format(new Date(y, m - 1, d), "d MMM"), to: format(new Date(y2, m2 - 1, d2), "d MMM yyyy"), count: dayKeys.length })
                : t("dayLog.pick", { date: format(new Date(y, m - 1, d), "d MMM yyyy") })}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {PRAYERS.map((p) => {
              const done = logged.has(p)
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={selected.has(p) ? "default" : "outline"}
                  aria-pressed={selected.has(p)}
                  disabled={loading || done}
                  className="h-12 flex-col gap-0.5 px-1 text-xs"
                  onClick={() => toggle(p)}
                >
                  {done && <Check className="h-3 w-3" />}
                  {t(`prayers.${p}`)}
                </Button>
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            disabled={loading}
            onClick={() => setSelected(new Set(getRemainingPrayers(logged)))}
          >
            {t("dayLog.selectAll")}
          </Button>
          <Button className="w-full" disabled={count === 0} onClick={save}>
            {multiDay ? t("dayLog.saveDays", { count, days: dayKeys.length }) : t("dayLog.save", { count })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
