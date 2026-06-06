import { format } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import i18n from "~/lib/i18n"

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

function dateLocale() {
  return i18n.language === "id" ? idLocale : enUS
}

export function formatLedgerDate(isoString: string): string {
  const wib = new Date(new Date(isoString).getTime() + WIB_OFFSET_MS)
  return format(wib, "d MMMM yyyy, HH:mm", { locale: dateLocale() }) + " WIB"
}

export function formatTodayDate(): string {
  return format(new Date(), "EEEE, d MMMM", { locale: dateLocale() })
}
