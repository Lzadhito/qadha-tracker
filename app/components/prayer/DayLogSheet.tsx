import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { eachDayOfInterval, format } from "date-fns"
import { Check } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { logAnchored } from "~/lib/log-actions"
import type { DayEntry } from "~/lib/outbox"
import { PRAYERS, loggedCells, useDatePrayerLog, type Prayer } from "~/lib/queries/use-remaining"
import { wibDateKey, wibNoonIso, wibYesterdayKey } from "~/lib/wib"

interface DayLogSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  // Today's log comes from the always-fresh cache, so today works offline without a fetch.
  todayDone: DayEntry[]
}

// Day(s) first, then a grid of prayer made up x prayer it was done after: "Fajr after Fajr, Dhuhr and
// Maghrib yesterday", or the same cells over a whole range of days, in one sheet and one save.
export function DayLogSheet({ open, onOpenChange, todayDone }: DayLogSheetProps) {
  const { t } = useTranslation()
  const [range, setRange] = useState(() => ({ from: wibYesterdayKey(), to: wibYesterdayKey() }))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showCalendar, setShowCalendar] = useState(false)

  const todayKey = wibDateKey()
  const [y, m, d] = range.from.split("-").map(Number)
  const [y2, m2, d2] = range.to.split("-").map(Number)
  const dayKeys = eachDayOfInterval({ start: new Date(y, m - 1, d), end: new Date(y2, m2 - 1, d2) }).map(
    (day) => format(day, "yyyy-MM-dd")
  )
  const multiDay = dayKeys.length > 1
  // Only a single day can show what is already logged; over a range every ticked cell is logged.
  const isToday = !multiDay && range.from === todayKey
  const dateLog = useDatePrayerLog(multiDay || isToday ? null : range.from)
  const loading = !multiDay && !isToday && dateLog.data === undefined
  const logged = loggedCells(multiDay ? [] : isToday ? todayDone : (dateLog.data ?? []))

  const pickDays = (from: string, to = from) => {
    setRange({ from, to })
    setSelected(new Set())
  }

  const toggle = (cell: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (!next.delete(cell)) next.add(cell)
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

  const ticked = PRAYERS.flatMap((prayer) =>
    PRAYERS.filter((anchor) => selected.has(`${prayer}:${anchor}`) && !logged.has(`${prayer}:${anchor}`)).map(
      (anchor) => ({ prayer, anchor })
    )
  )

  const save = () => {
    logAnchored(ticked, isToday ? undefined : dayKeys.map(wibNoonIso))
    close(false)
  }

  const count = ticked.length

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
          <div className="grid grid-cols-[4rem_repeat(5,1fr)] items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground leading-tight">{t("dayLog.afterHint")}</span>
            {PRAYERS.map((anchor) => (
              <span key={anchor} className="text-center text-[10px] text-muted-foreground">
                {t(`prayers.${anchor}`)}
              </span>
            ))}
            {PRAYERS.map((prayer) => (
              <Fragment key={prayer}>
                <span className="text-xs font-medium">{t(`prayers.${prayer}`)}</span>
                {PRAYERS.map((anchor) => {
                  const cell = `${prayer}:${anchor}`
                  const done = logged.has(cell)
                  return (
                    <Button
                      key={cell}
                      size="sm"
                      variant={selected.has(cell) || done ? "default" : "outline"}
                      aria-pressed={selected.has(cell)}
                      aria-label={t("dayLog.cell", { prayer: t(`prayers.${prayer}`), anchor: t(`prayers.${anchor}`) })}
                      disabled={loading || done}
                      className="h-9 px-0"
                      onClick={() => toggle(cell)}
                    >
                      {(done || selected.has(cell)) && <Check className="h-3.5 w-3.5" />}
                    </Button>
                  )
                })}
              </Fragment>
            ))}
          </div>
          <Button className="w-full" disabled={count === 0} onClick={save}>
            {multiDay ? t("dayLog.saveDays", { count, days: dayKeys.length }) : t("dayLog.save", { count })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
