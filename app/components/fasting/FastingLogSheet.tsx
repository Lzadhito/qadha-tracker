import { useState } from "react"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Calendar } from "~/components/ui/calendar"
import { logFasting } from "~/lib/log-actions"

function nowTimeStr() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`
}

interface FastingLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Lazy-loaded (calendar + dialog).
export function FastingLogSheet({ open, onOpenChange }: FastingLogSheetProps) {
  const { t } = useTranslation()
  const [qadhaDate, setQadhaDate] = useState<Date | undefined>()
  const [qadhaTime, setQadhaTime] = useState("12:00")

  const buildLoggedAt = (date: Date, time: string): string => {
    const [h, m] = time.split(":").map(Number)
    const d = new Date(date)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }

  const logQadha = (date?: Date, time?: string) => {
    logFasting(date ? buildLoggedAt(date, time ?? "12:00") : undefined)
    onOpenChange(false)
    setQadhaDate(undefined)
    setQadhaTime("12:00")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{t("fastingCard.whenFast")}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          <Button className="w-full" onClick={() => logQadha()}>
            {t("common.rightNow")}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">{t("fastingCard.orChooseDateTime")}</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <Calendar
            mode="single"
            selected={qadhaDate}
            onSelect={(d) => { setQadhaDate(d); if (d) setQadhaTime(nowTimeStr()) }}
            disabled={(d) => d > new Date()}
            className="mx-auto"
          />
          {qadhaDate && (
            <div className="space-y-1">
              <Label className="text-xs">{t("fastingCard.time")}</Label>
              <Input type="time" value={qadhaTime} onChange={(e) => setQadhaTime(e.target.value)} />
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            disabled={!qadhaDate}
            onClick={() => qadhaDate && logQadha(qadhaDate, qadhaTime)}
          >
            {qadhaDate ? t("fastingCard.logForAt", { date: format(qadhaDate, "d MMM yyyy"), time: qadhaTime }) : t("fastingCard.selectDateAbove")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
