import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { formatLedgerDate } from "~/lib/format"

interface HistoryRowProps {
  entry: {
    id: string
    obligation: "prayer" | "fasting"
    prayer?: string
    entry_type: string
    amount: number
    logged_at: string
  }
}

// One ledger entry as a tappable row. Shared by the History list and the calendar's day sheet.
export function HistoryRow({ entry }: HistoryRowProps) {
  const { t } = useTranslation()
  const entryLabel = (type: string) => t(`history.${type}`, { defaultValue: type })
  const prayerLabel = (p: string) => t(`prayers.${p}`, { defaultValue: p })

  return (
    <Link
      to={`/history/${entry.obligation}-${entry.id}`}
      className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <div>
        <p className="text-sm font-medium">
          {entry.obligation === "prayer"
            ? `${prayerLabel(entry.prayer ?? "")} — ${entryLabel(entry.entry_type)}`
            : `${t("history.fastingType")} — ${entryLabel(entry.entry_type)}`}
        </p>
        <p className="text-xs text-muted-foreground">{formatLedgerDate(entry.logged_at)}</p>
      </div>
      <span className={`text-sm font-mono ${entry.amount < 0 ? "text-primary" : "text-foreground/70"}`}>
        {entry.amount > 0 ? "+" : ""}
        {entry.amount}
      </span>
    </Link>
  )
}
