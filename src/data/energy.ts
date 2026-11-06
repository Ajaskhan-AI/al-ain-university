import { subDays } from 'date-fns'
import { OCCUPANCY, resolveDayType } from '../lib/calendar'
import { fromISODate, toISODate } from '../lib/dates'
import { createRng, hashString } from '../sim/rng'
import type { DayType, EnergyRecord } from '../types'
import { SEED_CALENDAR } from './academicCalendar'
import { BUILDINGS } from './buildings'

/**
 * Generated energy history: 365 days per building, ending yesterday.
 *
 * Not stored in localStorage (too big, and it never changes) — it is rebuilt
 * from a seeded RNG, so it is identical on every load.
 *
 * Model: daily kWh = peak kW × 24 h × load factor, where the load factor rises
 * with occupancy (academic calendar) and with cooling demand (month of year).
 * It always uses the ORIGINAL calendar: if a user edits the calendar later, the
 * meter data stays the same and only the analysis changes — just like real life.
 */

/** Cooling demand multiplier by month (Jan … Dec) for the UAE climate. */
export const COOLING = [0.75, 0.78, 0.88, 1.0, 1.18, 1.32, 1.42, 1.45, 1.33, 1.15, 0.95, 0.8]

/**
 * Hidden "waste" patterns for Module 5's detector to find: buildings that
 * use teaching-day energy when they should be nearly empty.
 */
const WASTE_RULES: Array<{ buildingId: string; dayTypes: DayType[] }> = [
  { buildingId: 'AIN-B3', dayTypes: ['weekend'] }, // Library AHUs left on 24/7 at weekends
  { buildingId: 'AUH-B2', dayTypes: ['summer', 'break'] }, // Admin building cooled as if fully occupied
  { buildingId: 'AIN-B6', dayTypes: ['holiday'] }, // Lecture halls lights + AC left on over holidays
]

function effectiveOccupancy(buildingId: string, dayType: DayType): number {
  const wasteful = WASTE_RULES.some((r) => r.buildingId === buildingId && r.dayTypes.includes(dayType))
  return wasteful ? Math.max(OCCUPANCY[dayType], 0.85) : OCCUPANCY[dayType]
}

const cache = new Map<string, EnergyRecord[]>()

export function getEnergyHistory(now: Date, days = 365): EnergyRecord[] {
  const key = `${toISODate(now)}:${days}`
  const cached = cache.get(key)
  if (cached) return cached

  const records: EnergyRecord[] = []
  for (const building of BUILDINGS) {
    for (let offset = days; offset >= 1; offset--) {
      const day = subDays(now, offset)
      const date = toISODate(day)
      const rng = createRng(hashString(`${building.id}:${date}`))
      const occupancy = effectiveOccupancy(building.id, resolveDayType(day, SEED_CALENDAR))
      const cooling = COOLING[day.getMonth()]
      const loadFactor = (0.22 + 0.38 * occupancy) * cooling * rng.range(0.94, 1.06)
      const peakKw = building.baseLoadKw * (0.35 + 0.65 * occupancy) * Math.min(cooling, 1.3) * rng.range(0.95, 1.05)
      records.push({
        buildingId: building.id,
        campus: building.campus,
        date,
        kWh: Math.round(building.baseLoadKw * 24 * loadFactor),
        peakKw: Math.round(peakKw),
      })
    }
  }
  cache.set(key, records)
  return records
}

/**
 * Splits one day's kWh into 24 hourly values (for the hour × day heatmap).
 * Occupied days follow a working-day curve with an afternoon cooling bump;
 * empty days are flat. Wasteful days look "occupied" — that is the giveaway.
 */
export function getHourlyProfile(record: EnergyRecord): number[] {
  const day = fromISODate(record.date)
  const occupancy = effectiveOccupancy(record.buildingId, resolveDayType(day, SEED_CALENDAR))
  const occupied = occupancy >= 0.7
  const rng = createRng(hashString(`${record.buildingId}:${record.date}:hourly`))

  const weights = Array.from({ length: 24 }, (_, hour) => {
    let w: number
    if (occupied) {
      if (hour < 6) w = 0.35
      else if (hour === 6) w = 0.55
      else if (hour <= 17) w = hour >= 13 && hour <= 16 ? 1.15 : 1
      else if (hour <= 20) w = 0.7
      else w = 0.45
    } else {
      w = hour >= 10 && hour <= 17 ? 0.45 : 0.35
    }
    return w * rng.range(0.93, 1.07)
  })
  const total = weights.reduce((sum, w) => sum + w, 0)
  return weights.map((w) => Math.round((record.kWh * w) / total))
}
