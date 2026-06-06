import type { Prayer } from "./queries/use-remaining"

const KEY = "qadha_today_prayers"

function wibDateStr(): string {
  const WIB_OFFSET = 7 * 60 * 60 * 1000
  return new Date(Date.now() + WIB_OFFSET).toISOString().slice(0, 10)
}

interface TodayState {
  date: string
  done: Prayer[]
}

function getState(): TodayState {
  try {
    const v = localStorage.getItem(KEY)
    if (!v) return { date: wibDateStr(), done: [] }
    const s = JSON.parse(v) as TodayState
    if (s.date !== wibDateStr()) return { date: wibDateStr(), done: [] }
    return s
  } catch {
    return { date: wibDateStr(), done: [] }
  }
}

export function getTodayDone(): Set<Prayer> {
  return new Set(getState().done)
}

export function toggleTodayPrayer(prayer: Prayer): Set<Prayer> {
  const s = getState()
  const done = new Set(s.done)
  if (done.has(prayer)) done.delete(prayer)
  else done.add(prayer)
  localStorage.setItem(KEY, JSON.stringify({ date: s.date, done: Array.from(done) }))
  return done
}
