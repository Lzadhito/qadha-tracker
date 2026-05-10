import { useState } from "react"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Calendar } from "~/components/ui/calendar"
import { useFastingLog } from "~/lib/queries/use-log-mutation"

function nowTimeStr() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`
}

interface FastingCardProps {
  remaining: number
}

export function FastingCard({ remaining }: FastingCardProps) {
  const [qadhaOpen, setQadhaOpen] = useState(false)
  const [qadhaDate, setQadhaDate] = useState<Date | undefined>()
  const [qadhaTime, setQadhaTime] = useState("12:00")
  const log = useFastingLog()

  const buildLoggedAt = (date: Date, time: string): string => {
    const [h, m] = time.split(":").map(Number)
    const d = new Date(date)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }

  const logQadha = (date?: Date, time?: string) => {
    const loggedAt = date ? buildLoggedAt(date, time ?? "12:00") : undefined
    log.mutate({ entryType: "qadha", amount: 1, loggedAt })
    setQadhaOpen(false)
    setQadhaDate(undefined)
    setQadhaTime("12:00")
  }

  if (remaining <= 0) {
    return (
      <div className="flex items-center justify-between py-3 px-1">
        <span className="font-medium text-sm">Fasting</span>
        <span className="text-primary text-sm">Done 🌙</span>
      </div>
    )
  }

  return (
    <div className="py-3 px-1">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-sm">Fasting</p>
          <p className="text-muted-foreground text-xs">{remaining.toLocaleString()} days remaining</p>
        </div>
        <Button size="sm" onClick={() => setQadhaOpen(true)} disabled={log.isPending} className="h-9 min-w-[90px]">
          Log 1 Fast
        </Button>
      </div>

      <Sheet open={qadhaOpen} onOpenChange={setQadhaOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>When did you fast this qadha?</SheetTitle>
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
              selected={qadhaDate}
              onSelect={(d) => { setQadhaDate(d); if (d) setQadhaTime(nowTimeStr()) }}
              disabled={(d) => d > new Date()}
              className="mx-auto"
            />
            {qadhaDate && (
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={qadhaTime} onChange={(e) => setQadhaTime(e.target.value)} />
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={!qadhaDate || log.isPending}
              onClick={() => qadhaDate && logQadha(qadhaDate, qadhaTime)}
            >
              {qadhaDate ? `Log for ${format(qadhaDate, "d MMM yyyy")} at ${qadhaTime}` : "Select a date above"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
