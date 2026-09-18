import { useTranslation } from "react-i18next"
import { CheckCircle2, Undo2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { undoTodayPrayer } from "~/lib/log-actions"
import { formatDaysLeft } from "~/lib/format"
import type { Prayer } from "~/lib/queries/use-remaining"

interface PrayerCardProps {
  prayer: Prayer
  // undefined while the first fetch is in flight: logging still works, only the count waits
  remaining: number | undefined
  loggedToday: boolean
  onQadha: (prayer: Prayer) => void
}

export function PrayerCard({ prayer, remaining, loggedToday, onQadha }: PrayerCardProps) {
  const { t } = useTranslation()
  const prayerName = t(`prayers.${prayer}`)

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{prayerName}</p>
        {remaining === undefined ? (
          <Skeleton className="h-3 w-32 mt-1" />
        ) : (
          <p className="text-muted-foreground text-xs">
            {remaining > 0
              ? t("prayerCard.remaining", { duration: formatDaysLeft(remaining, t) })
              : t("prayerCard.allPaidOff")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {loggedToday && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t("prayerCard.today")}
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 ml-0.5 text-muted-foreground hover:text-destructive"
              onClick={() => undoTodayPrayer(prayer)}
              title={t("prayerCard.undoTitle")}
            >
              <Undo2 className="h-3 w-3" />
            </Button>
          </span>
        )}
        <Button
          size="sm"
          variant={remaining !== undefined && remaining <= 0 ? "outline" : "default"}
          className="h-9 min-w-[80px]"
          onClick={() => onQadha(prayer)}
        >
          {t("prayerCard.qadha")}
        </Button>
      </div>
    </div>
  )
}
