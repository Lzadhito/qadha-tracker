import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"

function getOnboardingData() {
  return JSON.parse(sessionStorage.getItem("onboarding") || "{}")
}

export default function Baligh() {
  const navigate = useNavigate()
  const data = getOnboardingData()
  const birthYear: number = data.birthYear ?? new Date().getFullYear() - 25

  const [branch, setBranch] = useState<"remember" | "estimate" | "unknown">("remember")
  const [balighAge, setBalighAge] = useState("15")
  const [balighYear, setBalighYear] = useState(String(birthYear + 15))
  const [firstPeriodAge, setFirstPeriodAge] = useState("")

  const estimatedAge = data.gender === "female" && firstPeriodAge
    ? Number(firstPeriodAge)
    : Math.max(0, Number(balighYear) - birthYear)

  const resolvedAge =
    branch === "remember"
      ? Number(balighAge)
      : branch === "estimate"
        ? estimatedAge
        : 15

  const handleNext = () => {
    const saved = getOnboardingData()
    saved.balighAge = resolvedAge
    saved.balighCertain = branch === "remember"
    sessionStorage.setItem("onboarding", JSON.stringify(saved))
    navigate("/onboarding/prayers")
  }

  return (
    <Card className="p-8 space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Age of Religious Responsibility</h1>
        <p className="text-muted-foreground text-sm mt-1">
          When did you reach baligh (puberty)?
        </p>
      </div>

      <RadioGroup value={branch} onValueChange={(v) => setBranch(v as typeof branch)}>
        <div className="space-y-4">

          {/* Branch 1: I remember */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remember" id="remember" />
              <Label htmlFor="remember" className="font-normal cursor-pointer">
                I remember my age
              </Label>
            </div>
            {branch === "remember" && (
              <div className="ml-6 space-y-1">
                <Label className="text-xs">Age at baligh</Label>
                <Input
                  type="number"
                  min={7}
                  max={25}
                  value={balighAge}
                  onChange={(e) => setBalighAge(e.target.value)}
                  className="w-28"
                />
              </div>
            )}
          </div>

          {/* Branch 2: Help me estimate */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="estimate" id="estimate" />
              <Label htmlFor="estimate" className="font-normal cursor-pointer">
                Help me figure it out
              </Label>
            </div>
            {branch === "estimate" && (
              <div className="ml-6 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Year you became baligh</Label>
                  <Input
                    type="number"
                    min={birthYear + 7}
                    max={new Date().getFullYear()}
                    value={balighYear}
                    onChange={(e) => setBalighYear(e.target.value)}
                    className="w-28"
                  />
                </div>
                {data.gender === "female" && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Age at first period (optional — overrides year)
                    </Label>
                    <Input
                      type="number"
                      min={7}
                      max={20}
                      placeholder="e.g. 12"
                      value={firstPeriodAge}
                      onChange={(e) => setFirstPeriodAge(e.target.value)}
                      className="w-28"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Estimated age: <strong>{estimatedAge}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Branch 3: I don't know */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unknown" id="unknown" />
            <Label htmlFor="unknown" className="font-normal cursor-pointer">
              I don't know
            </Label>
          </div>
          {branch === "unknown" && (
            <p className="ml-6 text-xs text-muted-foreground">
              Using age 15 — the default most scholars apply when uncertain.
            </p>
          )}

        </div>
      </RadioGroup>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/onboarding/basics")} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Next
        </Button>
      </div>
    </Card>
  )
}
