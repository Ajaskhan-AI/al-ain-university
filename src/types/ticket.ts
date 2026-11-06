import type { CampusId } from './campus'
import type { Actor } from './user'

/** 'electrical' is internal (work orders raised from SMDB alerts); the public form offers the other five. */
export type TicketCategory = 'ac' | 'lighting' | 'plumbing' | 'cleaning' | 'other' | 'electrical'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

/** Where the ticket came from: a room QR, the helpdesk, or another module. */
export type TicketSource = 'qr' | 'helpdesk' | 'smdb_alert' | 'predictive' | 'energy'

export type TimelineEventType = 'created' | 'assigned' | 'reassigned' | 'started' | 'closed' | 'note'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  at: string
  by: Actor
  note?: string
}

export interface Ticket {
  id: string // e.g. WO-1001 — shown to the requester as the ticket number
  /** Room tickets come from a QR; alert-generated tickets may only have a building/asset. */
  roomId?: string
  assetId?: string
  smdbId?: string
  buildingId: string
  campus: CampusId
  category: TicketCategory
  description: string
  priority: TicketPriority
  source: TicketSource
  status: TicketStatus
  requesterName?: string
  requesterPhone?: string
  photoName?: string
  assignedTechnicianId?: string
  createdAt: string
  assignedAt?: string
  startedAt?: string
  closedAt?: string
  closeRemark?: string
  closePhotoName?: string
  timeline: TimelineEvent[]
}
