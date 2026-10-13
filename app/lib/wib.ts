const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

// yyyy-MM-dd of `date` in WIB (UTC+7), the day boundary the ledger uses.
export function wibDateKey(date?: Date): string {
  const ms = date ? date.getTime() : Date.now()
  return new Date(ms + WIB_OFFSET_MS).toISOString().slice(0, 10)
}

export function wibDayRange(dateKey: string): { start: string; end: string } {
  return {
    start: new Date(`${dateKey}T00:00:00+07:00`).toISOString(),
    end: new Date(`${dateKey}T23:59:59.999+07:00`).toISOString(),
  }
}

// Previous WIB day. `from` exists so tests can pin "now".
export function wibYesterdayKey(from?: Date): string {
  const ms = (from ? from.getTime() : Date.now()) - 24 * 60 * 60 * 1000
  return wibDateKey(new Date(ms))
}

// Past days have no meaningful time, so they are stamped at noon WIB: safely inside the day
// whatever timezone the device is in.
export function wibNoonIso(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00+07:00`).toISOString()
}
