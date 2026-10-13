import { useState } from "react"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
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

// Day first, prayers second: "yesterday I did Dhuhr and Asr" in one sheet, one save.
export function DayLogSheet({ open, onOpenChange, todayDone }: DayLogSheetProps) {
  const { t } = useTranslation()
  const [dayKey, setDayKey] = useState(() => wibYesterdayKey())
  const [selected, setSelected] = useState<Set<Prayer>>(new Set())
  const [showCalendar, setShowCalendar] = useState(false)

  const todayKey = wibDateKey()
  const isToday = dayKey === todayKey
  const dateLog = useDatePrayerLog(isToday ? null : dayKey)
  const loading = !isToday && dateLog.data === undefined
  const logged = isToday ? todayDone : (dateLog.data ?? new Set<Prayer>())

  const pickDay = (key: string) => {
    setDayKey(key)
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
      setDayKey(wibYesterdayKey())
      setSelected(new Set())
      setShowCalendar(false)
    }
  }

  const save = () => {
    const prayers = PRAYERS.filter((p) => selected.has(p) && !logged.has(p))
    logPrayers(prayers, isToday ? undefined : [wibNoonIso(dayKey)])
    close(false)
  }

  const [y, m, d] = dayKey.split("-").map(Number)
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
              variant={dayKey === todayKey ? "default" : "outline"}
              className="flex-1"
              onClick={() => pickDay(todayKey)}
            >
              {t("prayerCard.today")}
            </Button>
            <Button
              variant={dayKey === wibYesterdayKey() ? "default" : "outline"}
              className="flex-1"
              onClick={() => pickDay(wibYesterdayKey())}
            >
              {t("prayerCard.yesterday")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowCalendar((v) => !v)}>
              {t("dayLog.otherDate")}
            </Button>
          </div>
          {showCalendar && (
            <Calendar
              mode="single"
              selected={new Date(y, m - 1, d)}
              onSelect={(date) => date && pickDay(format(date, "yyyy-MM-dd"))}
              disabled={(date) => date > new Date()}
              className="mx-auto"
            />
          )}

          <p className="text-xs text-muted-foreground">
            {loading ? t("dayLog.checking") : t("dayLog.pick", { date: format(new Date(y, m - 1, d), "d MMM yyyy") })}
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
            {t("dayLog.save", { count })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
