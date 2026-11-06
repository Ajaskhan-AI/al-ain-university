import type { Ticket, TimelineEvent } from '../types'
import type { Action } from './actions'
import { STATE_VERSION, type AppState } from './state'

/** Replace one ticket by id using `update`; returns the same state if nothing changed. */
function updateTicket(state: AppState, ticketId: string, update: (ticket: Ticket) => Ticket | null): AppState {
  let changed = false
  const tickets = state.tickets.map((ticket) => {
    if (ticket.id !== ticketId) return ticket
    const next = update(ticket)
    if (!next) return ticket
    changed = true
    return next
  })
  return changed ? { ...state, tickets } : state
}

function withEvent(ticket: Ticket, event: Omit<TimelineEvent, 'id'>): TimelineEvent[] {
  return [...ticket.timeline, { id: `${ticket.id}-ev${ticket.timeline.length + 1}`, ...event }]
}

/**
 * A reducer takes the current state + an action and returns the NEW state.
 * It must not mutate the old state (always return new objects), so React can
 * see that something changed and re-render.
 */
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET_DEMO':
      // Fresh data, logged out (CLAUDE.md: "Reset demo data" logs out too).
      return {
        version: STATE_VERSION,
        seededAt: action.at,
        currentUserId: null,
        campus: 'ALL',
        ...action.data,
      }

    case 'SET_CAMPUS': {
      // Campus scoping: single-campus users are locked to their own campus.
      const user = state.users.find((u) => u.id === state.currentUserId)
      if (user && user.campus !== 'ALL') return state
      return { ...state, campus: action.campus }
    }

    case 'LOGIN': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      // Both-campus users start on "Both"; single-campus users see only theirs.
      return { ...state, currentUserId: user.id, campus: user.campus }
    }

    case 'LOGOUT':
      return { ...state, currentUserId: null, campus: 'ALL' }

    // ---------- Module 4: complaints & work orders ----------

    case 'CREATE_TICKET': {
      if (state.tickets.some((t) => t.id === action.ticket.id)) return state
      const number = Number(action.ticket.id.replace(/\D/g, ''))
      return {
        ...state,
        tickets: [...state.tickets, action.ticket],
        counters: { ...state.counters, ticket: Math.max(state.counters.ticket, number + 1) },
      }
    }

    case 'ASSIGN_TICKET': {
      const tech = state.technicians.find((t) => t.id === action.technicianId)
      if (!tech) return state
      return updateTicket(state, action.ticketId, (ticket) => {
        if (ticket.status === 'closed' || ticket.assignedTechnicianId === tech.id) return null
        const isReassign = !!ticket.assignedTechnicianId
        return {
          ...ticket,
          assignedTechnicianId: tech.id,
          // Response time is measured to the FIRST assignment.
          assignedAt: ticket.assignedAt ?? action.at,
          status: ticket.status === 'open' ? 'assigned' : ticket.status,
          timeline: withEvent(ticket, {
            type: isReassign ? 'reassigned' : 'assigned',
            at: action.at,
            by: action.by,
            note: `${isReassign ? 'Reassigned' : 'Assigned'} to ${tech.name}`,
          }),
        }
      })
    }

    case 'START_TICKET':
      return updateTicket(state, action.ticketId, (ticket) =>
        ticket.status !== 'assigned'
          ? null
          : {
              ...ticket,
              status: 'in_progress',
              startedAt: action.at,
              timeline: withEvent(ticket, { type: 'started', at: action.at, by: action.by }),
            },
      )

    case 'CLOSE_TICKET':
      return updateTicket(state, action.ticketId, (ticket) =>
        ticket.status !== 'in_progress' || !action.remark
          ? null
          : {
              ...ticket,
              status: 'closed',
              closedAt: action.at,
              closeRemark: action.remark,
              ...(action.photoName ? { closePhotoName: action.photoName } : {}),
              timeline: withEvent(ticket, { type: 'closed', at: action.at, by: action.by, note: action.remark }),
            },
      )

    case 'ADD_TICKET_NOTE':
      return updateTicket(state, action.ticketId, (ticket) =>
        !action.text
          ? null
          : { ...ticket, timeline: withEvent(ticket, { type: 'note', at: action.at, by: action.by, note: action.text }) },
      )

    default: {
      // If a new action type is added but not handled, TypeScript errors here.
      const unhandled: never = action
      return unhandled
    }
  }
}
