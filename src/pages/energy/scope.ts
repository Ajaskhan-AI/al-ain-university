import type { EnergyAnalysis, WasteFlag } from '../../lib/energyAnalysis'
import type { Building, DayType, EnergyRecord } from '../../types'

/** What the Energy page's filters select; passed to each tab. */
export interface EnergyScope {
  /** Records for the selected buildings and date range. */
  records: EnergyRecord[]
  /** Flags for the selected buildings and range (any period type). */
  flagsInScope: WasteFlag[]
  /** Flags after the period-type filter too. */
  flags: WasteFlag[]
  buildings: Building[]
  from: string
  to: string
  analysis: EnergyAnalysis
  matchesPeriod: (type: DayType) => boolean
}
