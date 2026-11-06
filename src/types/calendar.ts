/** Kinds of academic period the FM / sustainability team can put on the calendar. */
export type PeriodType = 'teaching' | 'exams' | 'ramadan' | 'break' | 'summer' | 'holiday'

export interface AcademicPeriod {
  id: string
  name: string
  type: PeriodType
  start: string // ISO date, inclusive
  end: string // ISO date, inclusive
}

/**
 * What a single day counts as after resolving overlaps and weekends.
 * 'unscheduled' = not covered by any period.
 */
export type DayType = PeriodType | 'weekend' | 'unscheduled'
