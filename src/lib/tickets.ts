import { subDays } from 'date-fns'
import type { Tone } from '../components/ui/Badge'
import { getBuilding } from '../data/buildings'
import type { Room, Ticket, TicketCategory, TicketPriority, TicketSource, TicketStatus } from '../types'

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ac: 'AC / cooling',
  lighting: 'Lighting',
  plumbing: 'Plumbing',
  cleaning: 'Cleaning',
  other: 'Other',
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In progress',
  closed: 'Closed',
}

/** Open = needs action (red), assigned = waiting (amber), in progress = info, closed = green. */
export const STATUS_TONE: Record<TicketStatus, Tone> = {
  open: 'alert',
  assigned: 'warn',
  in_progress: 'info',
  closed: 'ok',
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
export const PRIORITY_TONE: Record<TicketPriority, Tone> = { low: 'neutral', medium: 'warn', high: 'alert' }

export const SOURCE_LABELS: Record<TicketSource, string> = {
  qr: 'Room QR',
  helpdesk: 'Helpdesk',
  smdb_alert: 'SMDB alert',
  predictive: 'Predictive maintenance',
  energy: 'Energy analytics',
}

export const CATEGORIES: TicketCategory[] = ['ac', 'lighting', 'plumbing', 'cleaning', 'other']

/** Starting priority for a new complaint (staff can change it). */
export function defaultPriority(category: TicketCategory, room?: Room): TicketPriority {
  if (category === 'ac' && room && (room.type === 'lab' || room.type === 'lecture_hall')) return 'high'
  if (category === 'cleaning') return 'low'
  return 'medium'
}

/** Response time = created → first assigned. */
export function responseMs(ticket: Ticket): number | null {
  return ticket.assignedAt ? Date.parse(ticket.assignedAt) - Date.parse(ticket.createdAt) : null
}

/** Resolution time = created → closed. */
export function resolutionMs(ticket: Ticket): number | null {
  return ticket.closedAt ? Date.parse(ticket.closedAt) - Date.parse(ticket.createdAt) : null
}

export function average(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? nums.reduce((sum, v) => sum + v, 0) / nums.length : null
}

export function createdSince(tickets: Ticket[], since: Date): Ticket[] {
  const from = since.toISOString()
  return tickets.filter((t) => t.createdAt >= from)
}

export interface RepeatRoom {
  roomId: string
  count: number
  categories: TicketCategory[]
}

/** Rooms with `min`+ tickets in the last `days` days (CLAUDE.md: 3+ in 30 days). */
export function repeatFaultRooms(tickets: Ticket[], now: Date, days = 30, min = 3): RepeatRoom[] {
  const byRoom = new Map<string, Ticket[]>()
  for (const t of createdSince(tickets, subDays(now, days))) {
    if (!t.roomId) continue
    byRoom.set(t.roomId, [...(byRoom.get(t.roomId) ?? []), t])
  }
  return [...byRoom.entries()]
    .filter(([, list]) => list.length >= min)
    .map(([roomId, list]) => ({ roomId, count: list.length, categories: [...new Set(list.map((t) => t.category))] }))
    .sort((a, b) => b.count - a.count)
}

/** "Lecture Room 105 · Engineering" (falls back to the building for alert tickets). */
export function ticketLocation(ticket: Pick<Ticket, 'roomId' | 'buildingId'>, rooms: Room[]): string {
  const building = getBuilding(ticket.buildingId)
  const room = ticket.roomId ? rooms.find((r) => r.id === ticket.roomId) : undefined
  if (room) return `${room.name} · ${building?.shortName ?? ticket.buildingId}`
  return building?.name ?? ticket.buildingId
}

/** Sort: open/active first, high priority first, then newest. */
export function sortTicketsForWork(a: Ticket, b: Ticket): number {
  const statusOrder: Record<TicketStatus, number> = { open: 0, in_progress: 1, assigned: 2, closed: 3 }
  const priorityOrder: Record<TicketPriority, number> = { high: 0, medium: 1, low: 2 }
  return (
    statusOrder[a.status] - statusOrder[b.status] ||
    priorityOrder[a.priority] - priorityOrder[b.priority] ||
    b.createdAt.localeCompare(a.createdAt)
  )
}
