import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "~/components/ui/calendar"
import { useMonthQadha } from "~/lib/queries/use-month-qadha"
import { countByDay } from "~/lib/month-qadha"
import { DayEntriesSheet } from "./DayEntriesSheet"

// Month view with a dot per qadha done each day (a number past 5). Tapping a dotted day lists that day.
export function QadhaCalendar() {
  const [month, setMonth] = useState(() => new Date())
  const [openDay, setOpenDay] = useState<string | null>(null)
  const { days } = useMonthQadha(format(month, "yyyy-MM"))

  const marked = [...days.keys()].map((key) => {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, m - 1, d)
  })

  return (
    <div className="rounded-xl border border-border bg-card">
      <Calendar
        month={month}
        onMonthChange={setMonth}
        modifiers={{ qadha: marked }}
        counts={countByDay(days)}
        onDayClick={(date) => {
          const key = format(date, "yyyy-MM-dd")
          if (days.has(key)) setOpenDay(key)
        }}
        className="w-full bg-transparent [--cell-size:--spacing(9)]"
        classNames={{ root: "w-full" }}
      />
      <DayEntriesSheet
        dayKey={openDay}
        entries={(openDay && days.get(openDay)) || []}
        onOpenChange={(open) => !open && setOpenDay(null)}
      />
    </div>
  )
}
