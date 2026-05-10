import { useState } from "react"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Calendar } from "~/components/ui/calendar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { usePrayerFullDayLog } from "~/lib/queries/use-log-mutation"

function nowTimeStr() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`
}

interface FullDaySheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function FullDaySheet({ open, onOpenChange }: FullDaySheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState("12:00")
  const log = usePrayerFullDayLog()

  const logFullDay = (date?: Date, time?: string) => {
    let loggedAt: string | undefined
    if (date) {
      const [h, m] = (time ?? "12:00").split(":").map(Number)
      const d = new Date(date)
      d.setHours(h, m, 0, 0)
      loggedAt = d.toISOString()
    }
    log.mutate({ loggedAt }, {
      onSuccess: () => {
        onOpenChange(false)
        setSelectedDate(undefined)
        setSelectedTime("12:00")
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Log full day — all 5 prayers</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3 px-4">
          <p className="text-xs text-muted-foreground">
            Logs 1 qadha for Fajr, Dzuhr, Ashr, Maghrib, and Isha at once.
          </p>
          <Button className="w-full" onClick={() => logFullDay()} disabled={log.isPending}>
            Right now
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or choose date & time</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); if (d) setSelectedTime(nowTimeStr()) }}
            disabled={(d) => d > new Date()}
            className="mx-auto"
          />
          {selectedDate && (
            <div className="space-y-1">
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            disabled={!selectedDate || log.isPending}
            onClick={() => selectedDate && logFullDay(selectedDate, selectedTime)}
          >
            {selectedDate
              ? `Log for ${format(selectedDate, "d MMM yyyy")} at ${selectedTime}`
              : "Select a date above"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
