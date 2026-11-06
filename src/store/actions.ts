import { buildSeed } from '../data/seed'
import type { Actor, CampusFilter, CampusId, Ticket, TicketCategory, TicketPriority, TicketSource } from '../types'
import type { AppData } from './state'

/**
 * Every change to the store is described by one of these "actions".
 * Components call dispatch(action); the reducer decides the new state.
 * Each module adds its own actions here as it is built.
 */
export type Action =
  | { type: 'RESET_DEMO'; data: AppData; at: string }
  | { type: 'SET_CAMPUS'; campus: CampusFilter }
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  // Module 4 — complaints & work orders
  | { type: 'CREATE_TICKET'; ticket: Ticket }
  | { type: 'ASSIGN_TICKET'; ticketId: string; technicianId: string; by: Actor; at: string }
  | { type: 'START_TICKET'; ticketId: string; by: Actor; at: string }
  | { type: 'CLOSE_TICKET'; ticketId: string; remark: string; photoName?: string; by: Actor; at: string }
  | { type: 'ADD_TICKET_NOTE'; ticketId: string; text: string; by: Actor; at: string }

export interface NewTicketInput {
  /** Ticket number to use, e.g. `WO-${state.counters.ticket}` (so the UI can show it straight away). */
  id: string
  roomId?: string
  buildingId: string
  campus: CampusId
  assetId?: string
  smdbId?: string
  category: TicketCategory
  description: string
  priority: TicketPriority
  source: TicketSource
  requesterName?: string
  requesterPhone?: string
  photoName?: string
  by: Actor
}

const now = () => new Date().toISOString()

/** Copies only the optional fields that have a value (keeps saved data tidy). */
function defined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>
}

/** Action creators: small helpers so components don't build action objects by hand. */
export const actions = {
  /** Builds fresh seed data here (not in the reducer) so the reducer stays pure. */
  resetDemo(): Action {
    const at = new Date()
    return { type: 'RESET_DEMO', data: buildSeed(at), at: at.toISOString() }
  },
  setCampus(campus: CampusFilter): Action {
    return { type: 'SET_CAMPUS', campus }
  },
  /** Demo login: no password, just pick a user (also used by "Switch role"). */
  login(userId: string): Action {
    return { type: 'LOGIN', userId }
  },
  logout(): Action {
    return { type: 'LOGOUT' }
  },

  createTicket(input: NewTicketInput): Action {
    const at = now()
    const { id, by, ...rest } = input
    const ticket: Ticket = {
      id,
      ...defined({
        roomId: rest.roomId,
        assetId: rest.assetId,
        smdbId: rest.smdbId,
        requesterName: rest.requesterName?.trim(),
        requesterPhone: rest.requesterPhone?.trim(),
        photoName: rest.photoName,
      }),
      buildingId: rest.buildingId,
      campus: rest.campus,
      category: rest.category,
      description: rest.description.trim(),
      priority: rest.priority,
      source: rest.source,
      status: 'open',
      createdAt: at,
      timeline: [{ id: `${id}-ev1`, type: 'created', at, by }],
    }
    return { type: 'CREATE_TICKET', ticket }
  },
  assignTicket(ticketId: string, technicianId: string, by: Actor): Action {
    return { type: 'ASSIGN_TICKET', ticketId, technicianId, by, at: now() }
  },
  startTicket(ticketId: string, by: Actor): Action {
    return { type: 'START_TICKET', ticketId, by, at: now() }
  },
  closeTicket(ticketId: string, remark: string, by: Actor, photoName?: string): Action {
    return { type: 'CLOSE_TICKET', ticketId, remark: remark.trim(), by, at: now(), ...(photoName ? { photoName } : {}) }
  },
  addTicketNote(ticketId: string, text: string, by: Actor): Action {
    return { type: 'ADD_TICKET_NOTE', ticketId, text: text.trim(), by, at: now() }
  },
}
