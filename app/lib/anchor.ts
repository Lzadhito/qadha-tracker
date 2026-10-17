import { useEffect, useState } from "react"
import type { Prayer } from "./queries/use-remaining"

// The daily prayer a qadha is "done with". The default follows the device clock; a manual pick
// only lasts while the clock stays in the slot it was made in, so a forgotten pick can't stick.
// ponytail: rough fixed bounds, not real prayer times. Tune the table, or add a location-based
// source, if the default is often wrong.
const SLOTS: { anchor: Prayer; from: number }[] = [
  { anchor: "subuh", from: 4 * 60 },
  { anchor: "zuhur", from: 11 * 60 },
  { anchor: "asar", from: 14 * 60 + 30 },
  { anchor: "maghrib", from: 17 * 60 + 30 },
  { anchor: "isya", from: 19 * 60 },
]

export function anchorForClock(date: Date): Prayer {
  const minutes = date.getHours() * 60 + date.getMinutes()
  let current: Prayer = "isya" // before 04:00 still belongs to Isha
  for (const slot of SLOTS) if (minutes >= slot.from) current = slot.anchor
  return current
}

export interface AnchorPick {
  anchor: Prayer
  slot: Prayer // the clock slot when it was picked
}

export function resolveAnchor(date: Date, pick: AnchorPick | null): Prayer {
  const slot = anchorForClock(date)
  return pick && pick.slot === slot ? pick.anchor : slot
}

const KEY = "qadha:anchor"

function readPick(): AnchorPick | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AnchorPick) : null
  } catch {
    return null
  }
}

export function useAnchor(): [Prayer, (anchor: Prayer) => void] {
  const [now, setNow] = useState(() => new Date())
  const [pick, setPick] = useState<AnchorPick | null>(readPick)

  // Re-check the clock so the default moves on when a slot ends while the screen stays open.
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 60_000)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [])

  const choose = (anchor: Prayer) => {
    const next = { anchor, slot: anchorForClock(new Date()) }
    setPick(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // best-effort: the pick still works for this session
    }
  }

  return [resolveAnchor(now, pick), choose]
}
