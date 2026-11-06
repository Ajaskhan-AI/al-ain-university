import { PRIORITY_LABELS, PRIORITY_TONE, STATUS_LABELS, STATUS_TONE } from '../../lib/tickets'
import type { TicketPriority, TicketStatus } from '../../types'
import { Badge } from '../ui/Badge'

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABELS[priority]} priority</Badge>
}
