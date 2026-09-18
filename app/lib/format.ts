import type { TFunction } from "i18next"
import i18n from "~/lib/i18n"

// Built-in Intl instead of date-fns keeps date-fns (and its locales) out of the log screen's
// initial bundle. Parts are reassembled to keep the exact date-fns patterns noted below.
function dateParts(date: Date, options: Intl.DateTimeFormatOptions) {
  const locale = i18n.language === "id" ? "id-ID" : "en-US"
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const { type, value } of new Intl.DateTimeFormat(locale, options).formatToParts(date)) {
    parts[type] = value
  }
  return parts
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

// date-fns "d MMMM yyyy, HH:mm"
export function formatLedgerDate(isoString: string): string {
  const p = dateParts(new Date(isoString), {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  })
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}`
}

// date-fns "EEEE, d MMMM"
export function formatTodayDate(date: Date = new Date()): string {
  const p = dateParts(date, { weekday: "long", day: "numeric", month: "long" })
  return `${p.weekday}, ${p.day} ${p.month}`
}
