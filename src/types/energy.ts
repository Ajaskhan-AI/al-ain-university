import type { CampusId } from './campus'

/** One building's consumption for one day. */
export interface EnergyRecord {
  buildingId: string
  campus: CampusId
  date: string // ISO date
  kWh: number
  peakKw: number
}
