import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Card } from "~/components/ui/card"

export default function Basics() {
  const navigate = useNavigate()
  const [birthYear, setBirthYear] = useState(
    String(new Date().getFullYear() - 25)
  )
  const [gender, setGender] = useState("male")

  const handleNext = () => {
    // Store in sessionStorage for now (will be submitted on review)
    sessionStorage.setItem(
      "onboarding",
      JSON.stringify({
        birthYear: Number(birthYear),
        gender,
      })
    )
    navigate("/onboarding/baligh")
  }

  return (
    <Card className="p-8 space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Basic Information</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Let's start with the basics
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthYear">Birth Year</Label>
        <Input
          id="birthYear"
          type="number"
          min="1940"
          max={new Date().getFullYear()}
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label>Gender</Label>
        <RadioGroup value={gender} onValueChange={setGender}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="font-normal cursor-pointer">
              Male
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="font-normal cursor-pointer">
              Female
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button onClick={handleNext} className="w-full">
        Next
      </Button>
    </Card>
  )
}
