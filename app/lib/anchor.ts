import type { Prayer } from "./queries/use-remaining"

// The daily prayer a qadha is "done with" when logged by a one-tap: whichever slot the device clock is in.
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
