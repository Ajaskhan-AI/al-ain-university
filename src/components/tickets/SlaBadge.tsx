import { Clock } from 'lucide-react'
import { formatDuration } from '../../lib/format'
import { currentSla } from '../../lib/sla'
import type { Ticket } from '../../types'
import { Badge, type Tone } from '../ui/Badge'

/** "Assign in 25 min" · "Fix overdue 2 h" · "SLA met" — the clock that matters right now. */
export function SlaBadge({ ticket, now }: { ticket: Ticket; now: number }) {
  const { kind, clock } = currentSla(ticket, now)
  const verb = kind === 'response' ? 'Assign' : 'Fix'
  let tone: Tone = 'neutral'
  let text: string
  if (clock.done) {
    tone = clock.status === 'met' ? 'ok' : 'alert'
    text = clock.status === 'met' ? 'SLA met' : 'SLA missed'
  } else if (clock.status === 'breached') {
    tone = 'alert'
    text = `${verb} overdue ${formatDuration(-clock.remainingMs)}`
  } else {
    tone = clock.status === 'at_risk' ? 'warn' : 'neutral'
    text = `${verb} in ${formatDuration(clock.remainingMs)}`
  }
  return (
    <Badge tone={tone}>
      <Clock className="size-3" aria-hidden />
      {text}
    </Badge>
  )
}
