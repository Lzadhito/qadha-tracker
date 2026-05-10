import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

export type PrayerPattern = "consistent" | "completely_missed"
export type FastingPattern = "all_fasted" | "few_missed" | "half" | "few_fasted" | "none_fasted" | "custom"

const PRAYER_PATTERN_LABELS: Record<PrayerPattern, string> = {
  consistent: "Praying consistently (no qadha)",
  completely_missed: "Missing prayers (assume all missed)",
}

const FASTING_PATTERN_LABELS: Record<FastingPattern, string> = {
  all_fasted: "All fasted (0/Ramadan)",
  few_missed: "Few missed (~5/Ramadan)",
  half: "About half (15/Ramadan)",
  few_fasted: "Mostly missed (25/Ramadan)",
  none_fasted: "None fasted (30/Ramadan)",
  custom: "Custom",
}

const FASTING_PRESET_DAYS: Record<FastingPattern, number> = {
  all_fasted: 0,
  few_missed: 5,
  half: 15,
  few_fasted: 25,
  none_fasted: 30,
  custom: 0,
}

const PRAYER_PATTERN_PCT: Record<PrayerPattern, number> = {
  consistent: 0,
  completely_missed: 100,
}

export interface PrayerPhaseData {
  id: string
  startYear: number
  endYear: number
  pattern: PrayerPattern
  missedPct: number
}

export interface FastingPhaseData {
  id: string
  startYear: number
  endYear: number
  pattern: FastingPattern
  daysMissedPerRamadan: number
}

const currentYear = new Date().getFullYear()

interface PrayerPhaseCardProps {
  phase: PrayerPhaseData
  index: number
  total: number
  onChange: (id: string, updates: Partial<PrayerPhaseData>) => void
  onRemove: (id: string) => void
}

export function PrayerPhaseCard({ phase, index, total, onChange, onRemove }: PrayerPhaseCardProps) {
  const setPattern = (p: PrayerPattern) => {
    onChange(phase.id, { pattern: p, missedPct: PRAYER_PATTERN_PCT[p] })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Phase {index + 1}</span>
        {total > 1 && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onRemove(phase.id)}>
            Remove
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Start year</Label>
          <Input
            type="number"
            min={1940}
            max={phase.endYear}
            value={phase.startYear}
            onChange={(e) => onChange(phase.id, { startYear: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End year</Label>
          <Input
            type="number"
            min={phase.startYear}
            max={currentYear}
            value={phase.endYear}
            onChange={(e) => onChange(phase.id, { endYear: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Pattern</Label>
        <Select value={phase.pattern} onValueChange={(v) => setPattern(v as PrayerPattern)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRAYER_PATTERN_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}

interface FastingPhaseCardProps {
  phase: FastingPhaseData
  index: number
  total: number
  onChange: (id: string, updates: Partial<FastingPhaseData>) => void
  onRemove: (id: string) => void
}

export function FastingPhaseCard({ phase, index, total, onChange, onRemove }: FastingPhaseCardProps) {
  const setPattern = (p: FastingPattern) => {
    onChange(phase.id, {
      pattern: p,
      daysMissedPerRamadan: FASTING_PRESET_DAYS[p],
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Phase {index + 1}</span>
        {total > 1 && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onRemove(phase.id)}>
            Remove
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Start year</Label>
          <Input
            type="number"
            min={1940}
            max={phase.endYear}
            value={phase.startYear}
            onChange={(e) => onChange(phase.id, { startYear: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End year</Label>
          <Input
            type="number"
            min={phase.startYear}
            max={currentYear}
            value={phase.endYear}
            onChange={(e) => onChange(phase.id, { endYear: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Pattern</Label>
        <Select value={phase.pattern} onValueChange={(v) => setPattern(v as FastingPattern)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FASTING_PATTERN_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {phase.pattern === "custom" && (
        <div className="space-y-1">
          <Label className="text-xs">Days missed per Ramadan (0–30)</Label>
          <Input
            type="number"
            min={0}
            max={30}
            value={phase.daysMissedPerRamadan}
            onChange={(e) =>
              onChange(phase.id, {
                daysMissedPerRamadan: Math.min(30, Math.max(0, Number(e.target.value))),
              })
            }
          />
        </div>
      )}
    </div>
  )
}
