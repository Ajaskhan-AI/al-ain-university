import { buildSeed } from '../data/seed'
import type {
  AcademicPeriod,
  Actor,
  Alert,
  Asset,
  SmdbThresholds,
  CampusFilter,
  CampusId,
  ChecklistResult,
  PpmCompletion,
  PpmFrequency,
  PpmTask,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketSource,
  User,
} from '../types'
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
  | { type: 'SAVE_USER'; user: User }
  // Module 4 — complaints & work orders
  | { type: 'CREATE_TICKET'; ticket: Ticket }
  | { type: 'ASSIGN_TICKET'; ticketId: string; technicianId: string; by: Actor; at: string }
  | { type: 'START_TICKET'; ticketId: string; by: Actor; at: string }
  | { type: 'CLOSE_TICKET'; ticketId: string; remark: string; photoName?: string; by: Actor; at: string }
  | { type: 'ADD_TICKET_NOTE'; ticketId: string; text: string; by: Actor; at: string }
  // Module 3 — logbook & PPM
  | { type: 'COMPLETE_PPM_TASK'; taskId: string; completion: PpmCompletion }
  | { type: 'CREATE_ASSET'; asset: Asset }
  | { type: 'CREATE_PPM_TASK'; task: PpmTask }
  // Module 1 — SMDB alerts & thresholds (also used by Module 2 alerts)
  | { type: 'RAISE_ALERTS'; alerts: Array<Omit<Alert, 'id'>> }
  | { type: 'RESOLVE_ALERTS'; alertIds: string[]; at: string }
  | { type: 'ACK_ALERT'; alertId: string; by: Actor; at: string }
  | { type: 'ADD_ALERT_NOTE'; alertId: string; text: string; by: Actor; at: string }
  | { type: 'LINK_ALERT_WORK_ORDER'; alertId: string; ticketId: string }
  | { type: 'SET_THRESHOLDS'; smdbId: string; thresholds: SmdbThresholds }
  // Module 2 — predictive maintenance
  | { type: 'RESOLVE_PREDICTIVE'; assetId: string; by: Actor; at: string }
  // Module 5 — academic calendar & waste flags
  | { type: 'SAVE_PERIOD'; period: AcademicPeriod }
  | { type: 'DELETE_PERIOD'; periodId: string }
  | { type: 'SET_WASTE_REVIEWED'; flagId: string; reviewed: boolean }

export interface NewPpmTaskInput {
  /** Task id to use, e.g. formatPpmId(state.counters.ppm). */
  id: string
  assetId: string
  title: string
  frequency: PpmFrequency
  dueDate: string
  assignedTechnicianId?: string
  source: PpmTask['source']
  by: Actor
}

export interface PpmCompletionInput {
  technicianName: string
  results: ChecklistResult
  remarks: string
  photoName?: string
}

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
  energyFlagId?: string
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
  /** Users & Roles: add a demo user or update one (matched by id). */
  saveUser(user: User): Action {
    return { type: 'SAVE_USER', user }
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
        energyFlagId: rest.energyFlagId,
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

  completePpmTask(taskId: string, input: PpmCompletionInput, by: Actor): Action {
    const completion: PpmCompletion = {
      by,
      at: now(),
      technicianName: input.technicianName.trim(),
      results: input.results,
      remarks: input.remarks.trim(),
      ...(input.photoName ? { photoName: input.photoName } : {}),
    }
    return { type: 'COMPLETE_PPM_TASK', taskId, completion }
  },
  createAsset(asset: Omit<Asset, 'createdAt'>): Action {
    return { type: 'CREATE_ASSET', asset: { ...asset, createdAt: now() } }
  },
  raiseAlerts(alerts: Array<Omit<Alert, 'id'>>): Action {
    return { type: 'RAISE_ALERTS', alerts }
  },
  resolveAlerts(alertIds: string[]): Action {
    return { type: 'RESOLVE_ALERTS', alertIds, at: now() }
  },
  acknowledgeAlert(alertId: string, by: Actor): Action {
    return { type: 'ACK_ALERT', alertId, by, at: now() }
  },
  addAlertNote(alertId: string, text: string, by: Actor): Action {
    return { type: 'ADD_ALERT_NOTE', alertId, text: text.trim(), by, at: now() }
  },
  linkAlertWorkOrder(alertId: string, ticketId: string): Action {
    return { type: 'LINK_ALERT_WORK_ORDER', alertId, ticketId }
  },
  /** Add a new period or update an existing one (matched by id). */
  savePeriod(period: AcademicPeriod): Action {
    return { type: 'SAVE_PERIOD', period }
  },
  deletePeriod(periodId: string): Action {
    return { type: 'DELETE_PERIOD', periodId }
  },
  setWasteReviewed(flagId: string, reviewed: boolean): Action {
    return { type: 'SET_WASTE_REVIEWED', flagId, reviewed }
  },
  /** "Mark as resolved": the asset's health resets from now. */
  resolvePredictive(assetId: string, by: Actor): Action {
    return { type: 'RESOLVE_PREDICTIVE', assetId, by, at: now() }
  },
  setThresholds(smdbId: string, thresholds: SmdbThresholds): Action {
    return { type: 'SET_THRESHOLDS', smdbId, thresholds }
  },
  createPpmTask(input: NewPpmTaskInput): Action {
    const { id, by, assignedTechnicianId, ...rest } = input
    return {
      type: 'CREATE_PPM_TASK',
      task: { id, ...rest, ...(assignedTechnicianId ? { assignedTechnicianId } : {}), createdAt: now(), createdBy: by },
    }
  },
}
