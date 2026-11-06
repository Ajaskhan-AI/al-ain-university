import type { CampusId } from './campus'

export type Trade = 'hvac' | 'electrical' | 'plumbing' | 'general'

export interface Technician {
  id: string
  name: string
  trade: Trade
  campus: CampusId
  phone: string
  active: boolean
}
