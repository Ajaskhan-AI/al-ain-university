import { format } from 'date-fns'
import { ROLE_LABELS } from '../auth/roles'
import { getBuilding } from '../data/buildings'
import { formatDuration } from '../lib/format'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  resolutionMs,
  responseMs,
  ticketLocation,
} from '../lib/tickets'
import type { Actor, Room, Technician, Ticket, TimelineEventType } from '../types'
import { COLORS, addHeadersAndFooters, createDoc, drawCover, generatedLine, kpiBoxes, sectionTitle, table } from './pdfBase'

const EVENT_LABELS: Record<TimelineEventType, string> = {
  created: 'Reported',
  assigned: 'Assigned',
  reassigned: 'Reassigned',
  started: 'Work started',
  closed: 'Closed',
  note: 'Note',
}

const when = (iso?: string) => (iso ? format(new Date(iso), 'd MMM yyyy, HH:mm') : '-')
const role = (actor: Actor) =>
  actor.role === 'requester' ? 'Requester' : actor.role === 'system' ? 'System' : ROLE_LABELS[actor.role]

/** Single work-order PDF: details, times and the full timeline. */
export function downloadTicketPdf(ticket: Ticket, rooms: Room[], technicians: Technician[]): string {
  const doc = createDoc()
  const tech = technicians.find((t) => t.id === ticket.assignedTechnicianId)
  let y = drawCover(doc, `Work order ${ticket.id}`, [
    `Al Ain University  ·  ${ticketLocation(ticket, rooms)}`,
    generatedLine(),
  ])

  y = kpiBoxes(doc, y, [
    { label: 'Status', value: STATUS_LABELS[ticket.status], color: ticket.status === 'closed' ? COLORS.green : COLORS.amber },
    { label: 'Priority', value: PRIORITY_LABELS[ticket.priority], color: ticket.priority === 'high' ? COLORS.red : COLORS.amber },
    { label: 'Response time', value: formatDuration(responseMs(ticket)), sub: 'Reported -> assigned' },
    { label: 'Resolution time', value: formatDuration(resolutionMs(ticket)), sub: 'Reported -> closed' },
  ])

  y = sectionTitle(doc, y, '', 'Details')
  y = table(doc, y, {
    head: [['Field', 'Value']],
    body: [
      ['Category', CATEGORY_LABELS[ticket.category]],
      ['Description', ticket.description],
      ['Room', ticket.roomId ? `${ticketLocation(ticket, rooms)} (${ticket.roomId})` : '-'],
      ['Building', getBuilding(ticket.buildingId)?.name ?? ticket.buildingId],
      ['Reported by', [ticket.requesterName ?? ticket.timeline[0]?.by.name, ticket.requesterPhone].filter(Boolean).join(' · ')],
      ['Source', SOURCE_LABELS[ticket.source]],
      ['Technician', tech ? `${tech.name} (${tech.trade.toUpperCase()})` : 'Not assigned'],
      ['Reported', when(ticket.createdAt)],
      ['Assigned', when(ticket.assignedAt)],
      ['Work started', when(ticket.startedAt)],
      ['Closed', when(ticket.closedAt)],
      ['Closing remark', ticket.closeRemark ?? '-'],
      ...(ticket.photoName ? [['Photo (reported)', ticket.photoName]] : []),
      ...(ticket.closePhotoName ? [['Photo (after repair)', ticket.closePhotoName]] : []),
    ],
    columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
  })

  y = sectionTitle(doc, y, '', 'Timeline')
  table(doc, y, {
    head: [['Date / time', 'Event', 'By', 'Role', 'Note']],
    body: ticket.timeline.map((e) => [when(e.at), EVENT_LABELS[e.type], e.by.name, role(e.by), e.note ?? '']),
  })

  addHeadersAndFooters(doc, `Work order ${ticket.id}`)
  const fileName = `AAU-WorkOrder-${ticket.id}.pdf`
  doc.save(fileName)
  return fileName
}
