import { useTranslation } from "react-i18next"
import { HistoryRow } from "~/components/history/HistoryRow"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { formatTodayDate } from "~/lib/format"
import type { QadhaEntry } from "~/lib/month-qadha"
import { wibNoonIso } from "~/lib/wib"

interface DayEntriesSheetProps {
  dayKey: string | null
  entries: QadhaEntry[]
  onOpenChange: (open: boolean) => void
}

// The qadha done on one calendar day, in the same row format as History.
export function DayEntriesSheet({ dayKey, entries, onOpenChange }: DayEntriesSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet open={!!dayKey} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto max-w-lg mx-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{dayKey ? formatTodayDate(new Date(wibNoonIso(dayKey))) : ""}</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 px-4 pb-6">
          {entries.length === 0 && <p className="text-sm text-muted-foreground">{t("calendar.empty")}</p>}
          {entries.map((e) => (
            <HistoryRow key={`${e.obligation}-${e.id}`} entry={e} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
