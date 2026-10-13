import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { requireOnboarded } from "~/lib/guards"
import { useHistory } from "~/lib/queries/use-history"
import { HistoryRow } from "~/components/history/HistoryRow"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import type { ObligationType, EntryType } from "~/lib/queries/use-history"

export async function clientLoader() {
  return requireOnboarded()
}

export default function History() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [obligation, setObligation] = useState<ObligationType>("all")
  const [entryType, setEntryType] = useState<EntryType>("all")
  const bottomRef = useRef<HTMLDivElement>(null)
  const entryLabel = (type: string) => t(`history.${type}`, { defaultValue: type })

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
      <Button variant="ghost" size="sm" onClick={() => navigate("/log")} className="mb-4">
        ← {t("common.back")}
      </Button>
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        <img src="/sujud.svg" className="h-6 w-6" alt="" />
        {t("history.title")}
      </h1>

      <Tabs value={obligation} onValueChange={(v) => setObligation(v as ObligationType)}>
        <TabsList className="w-full mb-3">
          <TabsTrigger value="all" className="flex-1">{t("history.all")}</TabsTrigger>
          <TabsTrigger value="prayer" className="flex-1">{t("history.prayer")}</TabsTrigger>
          <TabsTrigger value="fasting" className="flex-1">{t("history.fasting")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={entryType} onValueChange={(v) => setEntryType(v as EntryType)}>
        <TabsList className="w-full mb-4 h-8">
          {(["all", "qadha", "miss", "adjustment"] as EntryType[]).map((et) => (
            <TabsTrigger key={et} value={et} className="flex-1 text-xs capitalize">
              {et === "all" ? t("history.all") : entryLabel(et)}
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
              <HistoryRow key={`${entry.obligation}-${entry.id}`} entry={entry} />
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
