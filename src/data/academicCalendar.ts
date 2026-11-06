import type { AcademicPeriod } from '../types'

/**
 * Indicative sample calendar for AY 2025–26 and AY 2026–27 — NOT AAU's official
 * calendar. Ramadan / Eid dates are approximate (they depend on moon sighting).
 * Weekends (Sat–Sun) are worked out automatically, so they are not listed here.
 * Overlaps are allowed; lib/calendar.ts decides which one wins for a day.
 */
export const SEED_CALENDAR: AcademicPeriod[] = [
  // AY 2025–26
  { id: 'cal-01', name: 'Fall 2025 — teaching', type: 'teaching', start: '2025-08-25', end: '2025-12-04' },
  { id: 'cal-02', name: 'National Day holiday', type: 'holiday', start: '2025-12-01', end: '2025-12-03' },
  { id: 'cal-03', name: 'Fall 2025 — final exams', type: 'exams', start: '2025-12-07', end: '2025-12-18' },
  { id: 'cal-04', name: 'Winter break', type: 'break', start: '2025-12-19', end: '2026-01-11' },
  { id: 'cal-05', name: 'Spring 2026 — teaching', type: 'teaching', start: '2026-01-12', end: '2026-05-07' },
  { id: 'cal-06', name: 'Ramadan 2026', type: 'ramadan', start: '2026-02-18', end: '2026-03-19' },
  { id: 'cal-07', name: 'Eid Al Fitr', type: 'holiday', start: '2026-03-20', end: '2026-03-23' },
  { id: 'cal-08', name: 'Spring break', type: 'break', start: '2026-03-30', end: '2026-04-05' },
  { id: 'cal-09', name: 'Spring 2026 — final exams', type: 'exams', start: '2026-05-10', end: '2026-05-21' },
  { id: 'cal-10', name: 'Eid Al Adha', type: 'holiday', start: '2026-05-26', end: '2026-05-29' },
  { id: 'cal-11', name: 'Summer break 2026', type: 'summer', start: '2026-05-22', end: '2026-08-23' },
  // AY 2026–27
  { id: 'cal-12', name: 'Fall 2026 — teaching', type: 'teaching', start: '2026-08-24', end: '2026-12-03' },
  { id: 'cal-13', name: 'National Day holiday', type: 'holiday', start: '2026-12-01', end: '2026-12-03' },
  { id: 'cal-14', name: 'Fall 2026 — final exams', type: 'exams', start: '2026-12-06', end: '2026-12-17' },
  { id: 'cal-15', name: 'Winter break', type: 'break', start: '2026-12-18', end: '2027-01-10' },
  { id: 'cal-16', name: 'Spring 2027 — teaching', type: 'teaching', start: '2027-01-11', end: '2027-05-06' },
  { id: 'cal-17', name: 'Ramadan 2027', type: 'ramadan', start: '2027-02-08', end: '2027-03-09' },
  { id: 'cal-18', name: 'Eid Al Fitr', type: 'holiday', start: '2027-03-10', end: '2027-03-12' },
  { id: 'cal-19', name: 'Spring 2027 — final exams', type: 'exams', start: '2027-05-09', end: '2027-05-20' },
  { id: 'cal-20', name: 'Eid Al Adha', type: 'holiday', start: '2027-05-16', end: '2027-05-19' },
  { id: 'cal-21', name: 'Summer break 2027', type: 'summer', start: '2027-05-21', end: '2027-08-22' },
]
