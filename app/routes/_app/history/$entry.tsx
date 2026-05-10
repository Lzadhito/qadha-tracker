import { useNavigate, useParams } from "react-router"
import { requireOnboarded } from "~/lib/guards"
import { useHistoryEntry, useDeleteEntry } from "~/lib/queries/use-history"
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

function formatLedgerDate(isoString: string): string {
  const d = new Date(isoString)
  const dateStr = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  })
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(d)
  const h = parts.find((p) => p.type === "hour")?.value ?? "00"
  const m = parts.find((p) => p.type === "minute")?.value ?? "00"
  return `${dateStr}, ${h}:${m} WIB`
}

const ENTRY_LABELS: Record<string, string> = {
  qadha: "Qadha",
  miss: "Miss",
  baseline: "Baseline",
  adjustment: "Adjustment",
}

const PRAYER_LABELS: Record<string, string> = {
  subuh: "Subuh",
  zuhur: "Zuhur",
  asar: "Asar",
  maghrib: "Maghrib",
  isya: "Isya",
}

export default function HistoryEntry() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const deleteEntry = useDeleteEntry()

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
        ← Back
      </Button>

      <h1 className="text-xl font-bold mb-6">Entry Detail</h1>

      {entry.isLoading ? (
        <div className="space-y-3 mb-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : entry.data ? (
        <div className="rounded-xl border border-border bg-card px-4 py-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">
              {entry.data.obligation === "prayer"
                ? `${PRAYER_LABELS[(entry.data as any).prayer] ?? ""} — ${ENTRY_LABELS[entry.data.entry_type] ?? entry.data.entry_type}`
                : `Fasting — ${ENTRY_LABELS[entry.data.entry_type] ?? entry.data.entry_type}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className={`text-sm font-mono font-medium ${entry.data.amount < 0 ? "text-primary" : "text-foreground/70"}`}>
              {entry.data.amount > 0 ? "+" : ""}{entry.data.amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Logged at</span>
            <span className="text-sm">{formatLedgerDate(entry.data.logged_at)}</span>
          </div>
          {(entry.data as any).fasted_on && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fasted on</span>
              <span className="text-sm">{(entry.data as any).fasted_on}</span>
            </div>
          )}
        </div>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={entry.isLoading}>
            Delete entry
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Remaining count adjusts accordingly. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteEntry.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
