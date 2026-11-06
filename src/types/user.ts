import type { CampusFilter } from './campus'

/** Logged-in demo roles. The public "Requester" has no login, so it is not a Role. */
export type Role =
  | 'fm_manager'
  | 'fm_engineer'
  | 'technician'
  | 'helpdesk'
  | 'sustainability'
  | 'admin'

export interface User {
  id: string
  name: string
  role: Role
  /** 'ALL' = both campuses. Single-campus users only ever see their campus. */
  campus: CampusFilter
  initials: string
  jobTitle: string
  /** Set for technician users: links the login to a Technician record. */
  technicianId?: string
}

/** Who did something. Recorded on every ticket/PPM/alert action. */
export interface Actor {
  name: string
  role: Role | 'requester' | 'system'
  userId?: string
}

/** "Who + when" pair, e.g. who acknowledged an alert. */
export interface ActionStamp {
  by: Actor
  at: string // ISO timestamp
}
