import { useTranslation } from "react-i18next"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"

interface FastingCardProps {
  // undefined while the first fetch is in flight: logging still works, only the count waits
  remaining: number | undefined
  onLog: () => void
}

export function FastingCard({ remaining, onLog }: FastingCardProps) {
  const { t } = useTranslation()

  if (remaining !== undefined && remaining <= 0) {
    return (
      <div className="flex items-center justify-between py-3 px-1">
        <span className="font-medium text-sm">{t("fastingCard.label")}</span>
        <span className="text-primary text-sm">{t("fastingCard.done")}</span>
      </div>
    )
  }

  return (
    <div className="py-3 px-1">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-sm">{t("fastingCard.label")}</p>
          {remaining === undefined ? (
            <Skeleton className="h-3 w-36 mt-1" />
          ) : (
            <p className="text-muted-foreground text-xs">{t("fastingCard.daysRemaining", { count: remaining })}</p>
          )}
        </div>
        <Button size="sm" onClick={onLog} className="h-9 min-w-[90px]">
          {t("fastingCard.log1Fast")}
        </Button>
      </div>
    </div>
  )
}
