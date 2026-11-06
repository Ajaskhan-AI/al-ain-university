import type { AcademicPeriod, DayType, PeriodType } from '../types'
import { toISODate } from './dates'

/** When periods overlap (e.g. Ramadan inside a teaching semester), the higher number wins. */
const PRIORITY: Record<PeriodType, number> = {
  holiday: 6,
  exams: 5,
  ramadan: 4,
  break: 3,
  summer: 2,
  teaching: 1,
}

/** UAE working week is Mon–Fri; the weekend is Saturday + Sunday. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Classify a day. Public holidays beat weekends; weekends beat every other period
 * (a Saturday in term time is still a weekend for occupancy purposes).
 */
export function resolveDayType(date: Date, periods: AcademicPeriod[]): DayType {
  const iso = toISODate(date)
  let best: PeriodType | null = null
  for (const period of periods) {
    if (iso < period.start || iso > period.end) continue
    if (best === null || PRIORITY[period.type] > PRIORITY[best]) best = period.type
  }
  if (best === 'holiday') return 'holiday'
  if (isWeekend(date)) return 'weekend'
  return best ?? 'unscheduled'
}

/** Relative building occupancy for each day type (1 = full teaching day). */
export const OCCUPANCY: Record<DayType, number> = {
  teaching: 1,
  exams: 0.85,
  ramadan: 0.75,
  break: 0.35,
  summer: 0.3,
  holiday: 0.2,
  weekend: 0.25,
  unscheduled: 0.35,
}

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  teaching: 'Teaching',
  exams: 'Exams',
  ramadan: 'Ramadan',
  break: 'Break',
  summer: 'Summer break',
  holiday: 'Public holiday',
  weekend: 'Weekend',
  unscheduled: 'Unscheduled',
}
