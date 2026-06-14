import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { requireOnboarded } from "~/lib/guards"
import { useHistoryEntry, useDeleteEntry } from "~/lib/queries/use-history"
import { formatLedgerDate } from "~/lib/format"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

export async function clientLoader() {
  return requireOnboarded()
}

export default function HistoryEntry() {
  const { t } = useTranslation()
  const { entryId } = useParams()
  const navigate = useNavigate()
  const deleteEntry = useDeleteEntry()
  const entryLabel = (type: string) => t(`history.${type}`, { defaultValue: type })
  const prayerLabel = (p: string) => t(`prayers.${p}`, { defaultValue: p })

  const [obligation, id] = (entryId ?? "").split(/-(.+)/)
  const entry = useHistoryEntry(id ?? "", obligation as "prayer" | "fasting")

  const handleDelete = async () => {
    if (!id || (obligation !== "prayer" && obligation !== "fasting")) return
    await deleteEntry.mutateAsync({ id, obligation })
    navigate("/history")
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="mb-4">
        ← {t("common.back")}
      </Button>

      <h1 className="text-xl font-bold mb-6">{t("history.entryDetail")}</h1>

      {entry.isLoading ? (
        <div className="space-y-3 mb-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : entry.data ? (
        <div className="rounded-xl border border-border bg-card px-4 py-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("history.type")}</span>
            <span className="text-sm font-medium">
              {entry.data.obligation === "prayer"
                ? `${prayerLabel((entry.data as any).prayer)} — ${entryLabel(entry.data.entry_type)}`
                : `${t("history.fastingType")} — ${entryLabel(entry.data.entry_type)}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("history.amount")}</span>
            <span className={`text-sm font-mono font-medium ${entry.data.amount < 0 ? "text-primary" : "text-foreground/70"}`}>
              {entry.data.amount > 0 ? "+" : ""}{entry.data.amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("history.loggedAt")}</span>
            <span className="text-sm">{formatLedgerDate(entry.data.logged_at)}</span>
          </div>
          {(entry.data as any).fasted_on && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("history.fastedOn")}</span>
              <span className="text-sm">{(entry.data as any).fasted_on}</span>
            </div>
          )}
        </div>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={entry.isLoading}>
            {t("history.deleteEntry")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("history.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("history.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteEntry.isPending}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
