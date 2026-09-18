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
