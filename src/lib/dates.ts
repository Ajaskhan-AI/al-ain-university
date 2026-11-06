import { format } from 'date-fns'

/** Date → 'yyyy-MM-dd' in local time (what we store for due dates, calendar days…). */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Same day as `day`, at the given local time. */
export function atTime(day: Date, hours: number, minutes = 0): Date {
  const result = new Date(day)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/** Parse 'yyyy-MM-dd' as a LOCAL date (new Date('2026-11-06') would be UTC). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
