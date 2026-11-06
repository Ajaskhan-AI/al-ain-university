import type { Ticket, TicketPriority } from '../types'

/**
 * Service-level targets (SLA) per priority, in minutes from when the complaint
 * was reported:
 *  - response   = until a technician is assigned
 *  - resolution = until the ticket is closed
 * Demo values — in a pilot they would match AAU's own FM contract.
 */
export const SLA_TARGETS: Record<TicketPriority, { respondMin: number; resolveMin: number }> = {
  high: { respondMin: 30, resolveMin: 4 * 60 },
  medium: { respondMin: 2 * 60, resolveMin: 24 * 60 },
  low: { respondMin: 8 * 60, resolveMin: 72 * 60 },
}

/** met / breached = finished (or already late); on_track / at_risk = still running. */
export type SlaStatus = 'met' | 'breached' | 'on_track' | 'at_risk'

export interface SlaClock {
  status: SlaStatus
  targetAt: number
  /** Time left (negative = overdue). For finished clocks: margin at completion. */
  remainingMs: number
  done: boolean
}

function clock(startMs: number, targetMin: number, doneIso: string | undefined, now: number): SlaClock {
  const targetAt = startMs + targetMin * 60_000
  if (doneIso) {
    const doneAt = Date.parse(doneIso)
    return { status: doneAt <= targetAt ? 'met' : 'breached', targetAt, remainingMs: targetAt - doneAt, done: true }
  }
  const remaining = targetAt - now
  if (remaining < 0) return { status: 'breached', targetAt, remainingMs: remaining, done: false }
  // "At risk" in the last quarter of the allowed time.
  return { status: remaining < targetMin * 60_000 * 0.25 ? 'at_risk' : 'on_track', targetAt, remainingMs: remaining, done: false }
}

export function ticketSla(ticket: Ticket, now = Date.now()) {
  const start = Date.parse(ticket.createdAt)
  const target = SLA_TARGETS[ticket.priority]
  return {
    response: clock(start, target.respondMin, ticket.assignedAt, now),
    resolution: clock(start, target.resolveMin, ticket.closedAt, now),
  }
}

/** The clock that matters right now: response until assigned, then resolution. */
export function currentSla(ticket: Ticket, now = Date.now()): { kind: 'response' | 'resolution'; clock: SlaClock } {
  const sla = ticketSla(ticket, now)
  return ticket.assignedAt || ticket.status === 'closed'
    ? { kind: 'resolution', clock: sla.resolution }
    : { kind: 'response', clock: sla.response }
}

/**
 * % of SLA clocks met, counting only clocks that are decided (finished, or
 * already overdue). Running, on-time clocks don't count yet.
 */
export function slaMetRate(tickets: Ticket[], now = Date.now()): number | null {
  let met = 0
  let decided = 0
  for (const t of tickets) {
    const sla = ticketSla(t, now)
    for (const c of [sla.response, sla.resolution]) {
      if (c.done || c.status === 'breached') {
        decided++
        if (c.status === 'met') met++
      }
    }
  }
  return decided ? Math.round((met / decided) * 100) : null
}

export function slaTargetLabel(priority: TicketPriority): string {
  const t = SLA_TARGETS[priority]
  const fmt = (min: number) => (min < 60 ? `${min} min` : `${min / 60} h`)
  return `Assign within ${fmt(t.respondMin)} · fix within ${fmt(t.resolveMin)}`
}
