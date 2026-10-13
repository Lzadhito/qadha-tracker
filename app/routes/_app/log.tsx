import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { CloudUpload, Settings } from "lucide-react"
import { requireOnboarded } from "~/lib/guards"
import {
  PRAYERS,
  usePendingCount,
  usePrayerRemaining,
  useFastingRemaining,
  useTodayPrayerLog,
  type Prayer,
} from "~/lib/queries/use-remaining"
import { formatTodayDate, formatDaysLeft } from "~/lib/format"
import { PrayerCard } from "~/components/prayer/PrayerCard"
import { FastingCard } from "~/components/fasting/FastingCard"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Separator } from "~/components/ui/separator"

// Sheets pull in the dialog, calendar and date-fns. They render (closed) on mount, which starts
// their download right after first paint instead of blocking it.
const PrayerLogSheet = lazy(() =>
  import("~/components/prayer/PrayerLogSheet").then((m) => ({ default: m.PrayerLogSheet }))
)
const FastingLogSheet = lazy(() =>
  import("~/components/fasting/FastingLogSheet").then((m) => ({ default: m.FastingLogSheet }))
)
const DayLogSheet = lazy(() =>
  import("~/components/prayer/DayLogSheet").then((m) => ({ default: m.DayLogSheet }))
)
const QadhaCalendar = lazy(() =>
  import("~/components/calendar/QadhaCalendar").then((m) => ({ default: m.QadhaCalendar }))
)

export async function clientLoader() {
  return requireOnboarded()
}

export default function Log() {
  const { t } = useTranslation()
  const prayers = usePrayerRemaining()
  const fasting = useFastingRemaining()
  const todayLog = useTodayPrayerLog()
  const pendingCount = usePendingCount()
  const [logPrayer, setLogPrayer] = useState<Prayer>("subuh")
  const [prayerSheetOpen, setPrayerSheetOpen] = useState(false)
  const [fastingSheetOpen, setFastingSheetOpen] = useState(false)
  const [dayLogOpen, setDayLogOpen] = useState(false)

  const todayDone = todayLog.data

  const prayerRemaining = prayers.data?.reduce((s, r) => s + r.remaining, 0) ?? 0
  const fastingRemaining = fasting.data?.displayRemaining ?? 0
  const prayerSummary = prayers.data ? formatDaysLeft(Math.ceil(prayerRemaining / 5), t) : null
  const fastingSummary = fasting.data && fastingRemaining > 0 ? t("duration.day", { count: fastingRemaining }) : null

  const today = formatTodayDate()

  const openPrayerSheet = (prayer: Prayer) => {
    setLogPrayer(prayer)
    setPrayerSheetOpen(true)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
      <p className="text-muted-foreground text-sm">{today}</p>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <img src="/sujud.svg" className="h-6 w-6" alt="" />
          {t("log.title")}
        </h1>
        <Button asChild variant="ghost" size="icon" title={t("nav.settings")}>
          <Link to="/settings" aria-label={t("nav.settings")}>
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {(prayerSummary || fastingSummary || pendingCount > 0) && (
        <div className="text-xs text-muted-foreground pb-1 space-y-0.5">
          {prayerSummary && <p>{t("log.prayerLeft", { duration: prayerSummary })}</p>}
          {fastingSummary && <p>{t("log.fastingLeft", { duration: fastingSummary })}</p>}
          {pendingCount > 0 && (
            <p className="flex items-center gap-1">
              <CloudUpload className="h-3 w-3" />
              {t("log.pendingSync", { count: pendingCount })}
            </p>
          )}
        </div>
      )}

      {/* Recording never waits on data: only the counts below fill in once loaded. */}
      <div className="flex flex-col gap-2 pb-2">
        <Button size="sm" className="w-full text-xs" onClick={() => setDayLogOpen(true)}>
          {t("log.logByDay")}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card px-4">
        {PRAYERS.map((p) => (
          <PrayerCard
            key={p}
            prayer={p}
            remaining={prayers.data?.find((r) => r.prayer === p)?.displayRemaining}
            loggedToday={todayDone.has(p)}
            onPickDate={openPrayerSheet}
          />
        ))}
      </div>

      <Separator className="my-4" />

      <div className="rounded-xl border border-border bg-card px-4">
        <FastingCard remaining={fasting.data?.displayRemaining} onLog={() => setFastingSheetOpen(true)} />
      </div>

      <Separator className="my-4" />

      <Suspense fallback={<Skeleton className="h-[22rem] w-full rounded-xl" />}>
        <QadhaCalendar />
      </Suspense>
      <Button asChild variant="ghost" className="w-full mt-2 text-muted-foreground">
        <Link to="/history">{t("calendar.viewHistory")}</Link>
      </Button>

      <Suspense fallback={null}>
        <PrayerLogSheet prayer={logPrayer} open={prayerSheetOpen} onOpenChange={setPrayerSheetOpen} />
        <FastingLogSheet open={fastingSheetOpen} onOpenChange={setFastingSheetOpen} />
        <DayLogSheet open={dayLogOpen} onOpenChange={setDayLogOpen} todayDone={todayDone} />
      </Suspense>
    </div>
  )
}
