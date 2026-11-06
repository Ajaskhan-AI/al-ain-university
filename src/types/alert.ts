import type { CampusId } from './campus'
import type { ActionStamp, Actor } from './user'

export type AlertSource = 'smdb' | 'predictive' | 'energy'
export type AlertSeverity = 'warning' | 'critical'

export interface AlertNote {
  by: Actor
  at: string
  text: string
}

export interface Alert {
  id: string // e.g. ALT-0001
  source: AlertSource
  severity: AlertSeverity
  title: string
  message: string
  campus: CampusId
  buildingId: string
  smdbId?: string
  assetId?: string
  createdAt: string
  acknowledged?: ActionStamp
  notes: AlertNote[]
  /** Ticket created from this alert ("Create work order"). */
  workOrderId?: string
  /** Condition that raised it (e.g. 'trip', 'high_load'), so the simulator can auto-resolve it. */
  code?: string
  resolvedAt?: string
}
