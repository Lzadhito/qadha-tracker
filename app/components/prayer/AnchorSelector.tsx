import { useTranslation } from "react-i18next"
import { Button } from "~/components/ui/button"
import { PRAYERS, type Prayer } from "~/lib/queries/use-remaining"

interface AnchorSelectorProps {
  anchor: Prayer
  onChange: (anchor: Prayer) => void
}

// Which daily prayer the qadha you log now is done with. Every +Qadha tap uses this.
export function AnchorSelector({ anchor, onChange }: AnchorSelectorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1.5 pb-1">
      <p className="text-xs text-muted-foreground">{t("anchor.label")}</p>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={t("anchor.label")}>
        {PRAYERS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === anchor ? "default" : "outline"}
            aria-pressed={p === anchor}
            className="h-9 px-1 text-xs"
            onClick={() => onChange(p)}
          >
            {t(`prayers.${p}`)}
          </Button>
        ))}
      </div>
    </div>
  )
}
