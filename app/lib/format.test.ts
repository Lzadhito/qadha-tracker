import { describe, expect, it } from "vitest"
import { format, addDays, addMinutes } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import i18n from "~/lib/i18n"
import { formatLedgerDate, formatTodayDate } from "./format"

// format.ts avoids date-fns for bundle size; it must still match the date-fns patterns exactly.
describe.each([
  ["en", enUS],
  ["id", idLocale],
] as const)("date formatting (%s) matches date-fns", (lang, locale) => {
  const days = Array.from({ length: 366 }, (_, i) => addMinutes(addDays(new Date(2026, 0, 1), i), i * 7))

  it("formatTodayDate", async () => {
    await i18n.changeLanguage(lang)
    for (const d of days) expect(formatTodayDate(d)).toBe(format(d, "EEEE, d MMMM", { locale }))
  })

  it("formatLedgerDate", async () => {
    await i18n.changeLanguage(lang)
    for (const d of days) {
      expect(formatLedgerDate(d.toISOString())).toBe(format(d, "d MMMM yyyy, HH:mm", { locale }))
    }
  })
})
