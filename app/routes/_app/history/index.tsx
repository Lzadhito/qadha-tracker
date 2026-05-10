import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import { requireOnboarded } from "~/lib/guards"
import { useHistory } from "~/lib/queries/use-history"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Skeleton } from "~/components/ui/skeleton"
import type { ObligationType, EntryType } from "~/lib/queries/use-history"

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

export async function clientLoader() {
  return requireOnboarded()
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

export default function History() {
  const [obligation, setObligation] = useState<ObligationType>("all")
  const [entryType, setEntryType] = useState<EntryType>("all")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useHistory(obligation, entryType)

  const entries = data?.pages.flat() ?? []

  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextPage() },
      { threshold: 0.1 }
    )
    observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage])

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">History</h1>

      <Tabs value={obligation} onValueChange={(v) => setObligation(v as ObligationType)}>
        <TabsList className="w-full mb-3">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="prayer" className="flex-1">Prayer</TabsTrigger>
          <TabsTrigger value="fasting" className="flex-1">Fasting</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={entryType} onValueChange={(v) => setEntryType(v as EntryType)}>
        <TabsList className="w-full mb-4 h-8">
          {(["all", "qadha", "miss", "adjustment"] as EntryType[]).map((t) => (
            <TabsTrigger key={t} value={t} className="flex-1 text-xs capitalize">
              {t === "all" ? "All" : ENTRY_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          : entries.map((entry) => (
              <Link
                key={`${entry.obligation}-${entry.id}`}
                to={`/history/${entry.obligation}-${entry.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {entry.obligation === "prayer"
                      ? `${PRAYER_LABELS[(entry as any).prayer] ?? ""} — ${ENTRY_LABELS[entry.entry_type] ?? entry.entry_type}`
                      : `Fasting — ${ENTRY_LABELS[entry.entry_type] ?? entry.entry_type}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatLedgerDate(entry.logged_at)}
                  </p>
                </div>
                <span
                  className={`text-sm font-mono ${entry.amount < 0 ? "text-primary" : "text-foreground/70"}`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount}
                </span>
              </Link>
            ))}
      </div>

      {isFetchingNextPage && (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}
