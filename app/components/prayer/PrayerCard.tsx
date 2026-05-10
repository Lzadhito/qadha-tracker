import { useState } from "react"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Calendar } from "~/components/ui/calendar"
import { usePrayerLog } from "~/lib/queries/use-log-mutation"
import type { Prayer } from "~/lib/queries/use-remaining"

const PRAYER_LABELS: Record<Prayer, string> = {
  subuh: "Subuh",
  zuhur: "Zuhur",
  asar: "Asar",
  maghrib: "Maghrib",
  isya: "Isya",
}

function nowTimeStr() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`
}

interface PrayerCardProps {
  prayer: Prayer
  remaining: number
}

export function PrayerCard({ prayer, remaining }: PrayerCardProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState("12:00")
  const log = usePrayerLog()

  const handleSelectDate = (d: Date | undefined) => {
    setSelectedDate(d)
    if (d) setSelectedTime(nowTimeStr())
  }

  const logQadha = (date?: Date, time?: string) => {
    let loggedAt: string | undefined
    if (date) {
      const [h, m] = (time ?? "12:00").split(":").map(Number)
      const d = new Date(date)
      d.setHours(h, m, 0, 0)
      loggedAt = d.toISOString()
    }
    log.mutate({ prayer, entryType: "qadha", amount: 1, loggedAt })
    setOpen(false)
    setSelectedDate(undefined)
    setSelectedTime("12:00")
  }

  if (remaining <= 0) {
    return (
      <div className="flex items-center justify-between py-3 px-1 border-b border-border/40 last:border-0">
        <span className="font-medium text-sm">{PRAYER_LABELS[prayer]}</span>
        <span className="text-primary text-sm">Done 🌙</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{PRAYER_LABELS[prayer]}</p>
        <p className="text-muted-foreground text-xs">{remaining.toLocaleString()} remaining</p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          size="sm"
          disabled={log.isPending}
          className="h-9 min-w-[90px] flex-shrink-0"
          onClick={() => setOpen(true)}
        >
          +1 Qadha
        </Button>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>When did you qadha {PRAYER_LABELS[prayer]}?</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3 px-4">
            <Button className="w-full" onClick={() => logQadha()}>
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
              onSelect={handleSelectDate}
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
              onClick={() => selectedDate && logQadha(selectedDate, selectedTime)}
            >
              {selectedDate
                ? `Log for ${format(selectedDate, "d MMM yyyy")} at ${selectedTime}`
                : "Select a date above"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
