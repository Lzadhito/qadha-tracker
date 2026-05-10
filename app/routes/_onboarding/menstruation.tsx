import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

export default function Menstruation() {
  const navigate = useNavigate()
  const [cycleDays, setCycleDays] = useState("28")
  const [periodDays, setPeriodDays] = useState("6")
  const [periodInRamadan, setPeriodInRamadan] = useState("6")

  const handleNext = () => {
    const data = JSON.parse(sessionStorage.getItem("onboarding") || "{}")
    data.avgCycleDays = Number(cycleDays)
    data.avgPeriodDays = Number(periodDays)
    data.avgPeriodInRamadan = Number(periodInRamadan)
    sessionStorage.setItem("onboarding", JSON.stringify(data))
    navigate("/onboarding/review")
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Menstruation Details</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Used to calculate prayer and fasting qadha accurately.
        </p>
      </div>

      <Card className="p-4 bg-muted/30 text-sm text-muted-foreground space-y-2">
        <p>Menstruation days are <strong className="text-foreground">excluded</strong> from prayer qadha — you are exempt.</p>
        <p>Menstruation days during Ramadan are <strong className="text-foreground">included</strong> in fasting qadha — these must be made up.</p>
      </Card>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Average cycle length (days)</Label>
          <Input
            type="number"
            min={1}
            max={60}
            value={cycleDays}
            onChange={(e) => setCycleDays(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Average period length (days)</Label>
          <Input
            type="number"
            min={1}
            max={15}
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Average period days during Ramadan</Label>
          <Input
            type="number"
            min={0}
            max={15}
            value={periodInRamadan}
            onChange={(e) => setPeriodInRamadan(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/onboarding/fasting")} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  )
}
