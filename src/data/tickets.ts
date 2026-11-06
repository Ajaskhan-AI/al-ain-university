import { addHours, addMinutes, subDays } from 'date-fns'
import { atTime } from '../lib/dates'
import type { Rng } from '../sim/rng'
import type {
  Actor,
  CampusId,
  Room,
  Technician,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketSource,
  TicketStatus,
  TimelineEvent,
  Trade,
  User,
} from '../types'
import { technicianActor } from './ppmTasks'

export const CATEGORY_TRADE: Record<TicketCategory, Trade> = {
  ac: 'hvac',
  lighting: 'electrical',
  plumbing: 'plumbing',
  cleaning: 'general',
  other: 'general',
}

const DESCRIPTIONS: Record<TicketCategory, string[]> = {
  ac: ['AC not cooling, room is very warm', 'Water dripping from the AC unit in the ceiling', 'Loud noise from the AC vent', 'Thermostat not responding'],
  lighting: ['Two ceiling lights not working', 'Light flickering near the whiteboard', 'Corridor lights are off', 'Lights stay on after the room is empty'],
  plumbing: ['Tap leaking continuously', 'Toilet flush not working', 'Sink drain is blocked', 'Water on the floor near the washbasin'],
  cleaning: ['Bins are overflowing', 'Spill on the floor needs cleaning', 'Washroom needs cleaning', 'Dust on desks after maintenance work'],
  other: ['Door lock is jammed', 'Broken chair in the front row', 'Window blind is stuck', 'Power socket not working at a desk'],
}

const CLOSE_REMARKS: Record<TicketCategory, string[]> = {
  ac: ['Cleaned FCU filter and condensate drain; cooling restored.', 'Thermostat replaced and calibrated.', 'Fan motor bearing lubricated; noise resolved.'],
  lighting: ['Replaced 2 LED panels.', 'Replaced faulty driver.', 'Reset lighting contactor; timer corrected.'],
  plumbing: ['Replaced tap cartridge.', 'Replaced flush valve.', 'Drain cleared with rodding.'],
  cleaning: ['Area cleaned and bins emptied.', 'Washroom cleaned and restocked.'],
  other: ['Lock mechanism lubricated and adjusted.', 'Chair replaced from store.', 'Blind cord replaced.'],
}

const REQUESTERS = ['Sara (student)', 'Omar (student)', 'Dr. Khalid', 'Ms. Noura (staff)', 'Hassan (student)', 'Lab assistant']

/** Picks a likely complaint category for the room type. */
function categoryFor(room: Room, rng: Rng): TicketCategory {
  if (room.type === 'washroom') return rng.pick<TicketCategory>(['plumbing', 'plumbing', 'cleaning'])
  if (room.type === 'lab') return rng.pick<TicketCategory>(['ac', 'ac', 'lighting', 'plumbing', 'other'])
  return rng.pick<TicketCategory>(['ac', 'ac', 'ac', 'lighting', 'lighting', 'cleaning', 'other'])
}

interface Plan {
  roomId: string
  category: TicketCategory
  daysAgo: number
  /** Force the final status (used for the scripted repeat-fault tickets). */
  status?: TicketStatus
}

/** Scripted tickets: two repeat-fault rooms (3+ tickets in 30 days) and fresh ones for the demo. */
const SCRIPTED: Plan[] = [
  { roomId: 'AIN-B2-105', category: 'ac', daysAgo: 26 },
  { roomId: 'AIN-B2-105', category: 'ac', daysAgo: 14 },
  { roomId: 'AIN-B2-105', category: 'ac', daysAgo: 3, status: 'in_progress' },
  { roomId: 'AUH-B1-G12', category: 'plumbing', daysAgo: 22 },
  { roomId: 'AUH-B1-G12', category: 'plumbing', daysAgo: 9 },
  { roomId: 'AUH-B1-G12', category: 'plumbing', daysAgo: 1, status: 'open' },
  { roomId: 'AIN-B5-012', category: 'lighting', daysAgo: 18 },
  { roomId: 'AIN-B5-012', category: 'lighting', daysAgo: 5 },
  { roomId: 'AUH-B3-G02', category: 'ac', daysAgo: 0, status: 'open' },
  { roomId: 'AIN-B4-110', category: 'other', daysAgo: 0, status: 'assigned' },
]

interface Input {
  rooms: Room[]
  technicians: Technician[]
  users: User[]
  now: Date
  rng: Rng
}

export function generateTickets({ rooms, technicians, users, now, rng }: Input): Ticket[] {
  const helpdesk = users.find((u) => u.role === 'helpdesk')
  const engineerFor = (campus: CampusId) => users.find((u) => u.role === 'fm_engineer' && u.campus === campus)
  const asActor = (u: User | undefined): Actor =>
    u ? { name: u.name, role: u.role, userId: u.id } : { name: 'FM team', role: 'system' }

  const plans: Plan[] = [...SCRIPTED]
  while (plans.length < 30) {
    const room = rng.pick(rooms)
    plans.push({ roomId: room.id, category: categoryFor(room, rng), daysAgo: rng.int(1, 40) })
  }

  const drafts = plans.map((plan, planIndex): Omit<Ticket, 'id'> => {
    const room = rooms.find((r) => r.id === plan.roomId)
    if (!room) throw new Error(`Seed ticket references unknown room ${plan.roomId}`)

    let created = addMinutes(atTime(subDays(now, plan.daysAgo), rng.int(7, 18)), rng.int(0, 59))
    if (created > now) created = addMinutes(now, -rng.int(30, 240))

    const source: TicketSource = rng.chance(0.7) ? 'qr' : 'helpdesk'
    const requesterName = rng.chance(0.6) ? rng.pick(REQUESTERS) : undefined
    const priority: TicketPriority =
      plan.category === 'ac' && (room.type === 'lab' || room.type === 'lecture_hall')
        ? 'high'
        : rng.pick<TicketPriority>(['low', 'medium', 'medium'])

    // Decide how far along the ticket should be.
    const ageHours = (now.getTime() - created.getTime()) / 3_600_000
    const target: TicketStatus =
      plan.status ??
      (ageHours > 72
        ? rng.chance(0.9) ? 'closed' : 'in_progress'
        : rng.pick<TicketStatus>(['open', 'assigned', 'in_progress', 'closed']))

    const tech = technicians.find((t) => t.campus === room.campus && t.trade === CATEGORY_TRADE[plan.category])
    const timeline: TimelineEvent[] = []
    const event = (type: TimelineEvent['type'], at: Date, by: Actor, note?: string) =>
      timeline.push({ id: `ev-${planIndex}-${timeline.length}`, type, at: at.toISOString(), by, ...(note ? { note } : {}) })

    event(
      'created',
      created,
      source === 'qr' ? { name: requesterName ?? 'Anonymous (room QR)', role: 'requester' } : asActor(helpdesk),
    )

    const ticket: Omit<Ticket, 'id'> = {
      roomId: room.id,
      buildingId: room.buildingId,
      campus: room.campus,
      category: plan.category,
      description: rng.pick(DESCRIPTIONS[plan.category]),
      priority,
      source,
      status: 'open',
      ...(requesterName ? { requesterName } : {}),
      createdAt: created.toISOString(),
      timeline,
    }

    // Walk the status flow, stopping at the target status or at "now".
    if (target === 'open' || !tech) return ticket

    const assigned = addMinutes(created, rng.int(10, 120))
    if (assigned > now) return ticket
    const assigner = rng.chance(0.4) ? helpdesk : engineerFor(room.campus)
    event('assigned', assigned, asActor(assigner), `Assigned to ${tech.name}`)
    Object.assign(ticket, { status: 'assigned', assignedTechnicianId: tech.id, assignedAt: assigned.toISOString() })
    if (target === 'assigned') return ticket

    const started = addMinutes(assigned, rng.int(15, 180))
    if (started > now) return ticket
    const techActor = technicianActor(tech, users)
    event('started', started, techActor)
    Object.assign(ticket, { status: 'in_progress', startedAt: started.toISOString() })
    if (target === 'in_progress') return ticket

    const hours = plan.category === 'ac' ? rng.range(2, 30) : rng.range(0.5, 8)
    const closed = addHours(started, hours)
    if (closed > now) return ticket
    const remark = rng.pick(CLOSE_REMARKS[plan.category])
    event('closed', closed, techActor, remark)
    Object.assign(ticket, { status: 'closed', closedAt: closed.toISOString(), closeRemark: remark })
    return ticket
  })

  drafts.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return drafts.map((draft, i) => {
    const id = `WO-${1001 + i}`
    // Re-key timeline events with the final ticket number so IDs are unique and readable.
    const timeline = draft.timeline.map((ev, j) => ({ ...ev, id: `${id}-ev${j + 1}` }))
    return { id, ...draft, timeline }
  })
}
