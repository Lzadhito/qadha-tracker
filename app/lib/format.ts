import { format } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import type { TFunction } from "i18next"
import i18n from "~/lib/i18n"

function dateLocale() {
  return i18n.language === "id" ? idLocale : enUS
}

// Break a raw day count into years / months / days using i18n duration keys.
export function formatDaysLeft(days: number, t: TFunction): string | null {
  if (days <= 0) return null
  const years = Math.floor(days / 365)
  const afterYears = days - years * 365
  const months = Math.floor(afterYears / 30)
  const d = afterYears - months * 30
  const parts: string[] = []
  if (years > 0) parts.push(t("duration.year", { count: years }))
  if (months > 0) parts.push(t("duration.month", { count: months }))
  if (d > 0 || parts.length === 0) parts.push(t("duration.day", { count: d }))
  return parts.join(" ")
}

export function formatLedgerDate(isoString: string): string {
  return format(new Date(isoString), "d MMMM yyyy, HH:mm", { locale: dateLocale() })
}

export function formatTodayDate(): string {
  return format(new Date(), "EEEE, d MMMM", { locale: dateLocale() })
}
