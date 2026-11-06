import { eachDayOfInterval } from 'date-fns'
import { BUILDINGS } from '../data/buildings'
import { COOLING } from '../data/energy'
import type { AcademicPeriod, CampusId, DayType, EnergyRecord } from '../types'
import { OCCUPANCY, resolveDayType } from './calendar'
import { fromISODate, toISODate } from './dates'

/**
 * Module 5 — "does energy use match occupancy?"
 *
 * 1. Weather-normalised baseline: for each building, the typical teaching-day
 *    consumption divided by that month's cooling factor (so July and January
 *    can be compared).
 * 2. Expected use on a low-occupancy day = baseline × cooling factor ×
 *    expected share for that period type (e.g. a weekend ≈ 53 % of a teaching day).
 * 3. Flag the day when actual use is more than 25 % above expected.
 *
 * Period types come from the EDITABLE academic calendar, so editing the
 * calendar recalculates every flag.
 */

/** Indicative blended electricity tariff for cost estimates (to be confirmed with the utility tariff). */
export const TARIFF_AED_PER_KWH = 0.3
export const TARIFF_NOTE = 'Indicative blended tariff of 0.30 AED/kWh — to be confirmed with the actual utility tariff during the pilot.'

/** Day types when buildings should be mostly empty. */
export const LOW_OCCUPANCY: DayType[] = ['weekend', 'holiday', 'break', 'summer', 'unscheduled']

/** Expected consumption as a share of a teaching day (base load + occupancy-driven load). */
export const EXPECTED_SHARE: Record<DayType, number> = Object.fromEntries(
  (Object.keys(OCCUPANCY) as DayType[]).map((t) => [t, (0.22 + 0.38 * OCCUPANCY[t]) / 0.6]),
) as Record<DayType, number>

/** Flag when actual use is this much above expected (1.25 = +25 %). */
export const FLAG_RATIO = 1.25

export interface WasteFlag {
  /** `${buildingId}:${date}` — used for "Mark as reviewed" and linking work orders. */
  id: string
  buildingId: string
  campus: CampusId
  date: string
  dayType: DayType
  actualKwh: number
  expectedKwh: number
  excessKwh: number
  /** How far above expected, in %. */
  excessPct: number
  aed: number
}

export interface EnergyAnalysis {
  /** Period type of every day in the history (from the editable calendar). */
  dayTypes: Map<string, DayType>
  flags: WasteFlag[]
  /** Expected kWh per `${buildingId}:${date}` (for charts). */
  expected: Map<string, number>
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const cooling = (date: string) => COOLING[fromISODate(date).getMonth()]

export function analyseEnergy(records: EnergyRecord[], calendar: AcademicPeriod[]): EnergyAnalysis {
  const dayTypes = new Map<string, DayType>()
  if (records.length) {
    const dates = records.map((r) => r.date).sort()
    for (const day of eachDayOfInterval({ start: fromISODate(dates[0]), end: fromISODate(dates[dates.length - 1]) })) {
      dayTypes.set(toISODate(day), resolveDayType(day, calendar))
    }
  }

  // Weather-normalised teaching-day baseline per building.
  const baseline = new Map<string, number>()
  for (const b of BUILDINGS) {
    const teaching = records.filter((r) => r.buildingId === b.id && dayTypes.get(r.date) === 'teaching').map((r) => r.kWh / cooling(r.date))
    baseline.set(b.id, median(teaching))
  }

  const flags: WasteFlag[] = []
  const expected = new Map<string, number>()
  for (const r of records) {
    const type = dayTypes.get(r.date) ?? 'unscheduled'
    const exp = (baseline.get(r.buildingId) ?? 0) * cooling(r.date) * EXPECTED_SHARE[type]
    expected.set(`${r.buildingId}:${r.date}`, exp)
    if (!LOW_OCCUPANCY.includes(type) || exp <= 0) continue
    if (r.kWh > exp * FLAG_RATIO) {
      const excess = r.kWh - exp
      flags.push({
        id: `${r.buildingId}:${r.date}`,
        buildingId: r.buildingId,
        campus: r.campus,
        date: r.date,
        dayType: type,
        actualKwh: r.kWh,
        expectedKwh: Math.round(exp),
        excessKwh: Math.round(excess),
        excessPct: Math.round((excess / exp) * 100),
        aed: Math.round(excess * TARIFF_AED_PER_KWH),
      })
    }
  }
  flags.sort((a, b) => b.date.localeCompare(a.date) || b.excessKwh - a.excessKwh)
  return { dayTypes, flags, expected }
}

/** Colours for academic period bands (charts) and badges. */
export const PERIOD_COLORS: Record<DayType, string> = {
  teaching: '#c3d1e8',
  exams: '#99f6e4',
  ramadan: '#fde68a',
  break: '#e2e8f0',
  summer: '#fed7aa',
  holiday: '#fecaca',
  weekend: '#f1f5f9',
  unscheduled: '#f1f5f9',
}
