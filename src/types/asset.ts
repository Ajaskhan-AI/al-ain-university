import type { CampusId } from './campus'
import type { Trade } from './technician'

export type AssetCategory = 'chiller' | 'ahu' | 'pump' | 'generator' | 'smdb'

/** One line of a PPM checklist: either a tick box or a measured reading. */
export type ChecklistItem =
  | { id: string; label: string; kind: 'check' }
  | { id: string; label: string; kind: 'reading'; unit: string; min: number; max: number }

export interface Asset {
  /** The QR tag ID, e.g. AAU-AIN-AHU-03. Used as the primary key. */
  id: string
  name: string
  category: AssetCategory
  campus: CampusId
  buildingId: string
  location: string
  description: string
  installYear: number
  /** Which trade maintains it (decides who PPM tasks go to). */
  trade: Trade
  /** Has CT clamps fitted → appears in Predictive Maintenance. */
  monitored: boolean
  /** For category 'smdb': the live-monitored board this asset is. */
  smdbId?: string
  createdAt: string
}
