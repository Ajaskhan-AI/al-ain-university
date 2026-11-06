import clsx from 'clsx'
import { format } from 'date-fns'
import { Check } from 'lucide-react'
import { STAFF_STEP_LABELS } from '../../lib/tickets'
import type { Ticket } from '../../types'

/** Open → Assigned → In progress → Closed, with the time each step happened. */
export function StatusStepper({ ticket, labels = STAFF_STEP_LABELS }: { ticket: Ticket; labels?: string[] }) {
  const times = [ticket.createdAt, ticket.assignedAt, ticket.startedAt, ticket.closedAt]
  const current = times.reduce((last, t, i) => (t ? i : last), 0)

  return (
    <ol className="flex items-start" aria-label="Ticket progress">
      {labels.map((label, i) => {
        const done = i <= current
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={clsx('absolute top-3.5 right-1/2 h-0.5 w-full', i <= current ? 'bg-teal-500' : 'bg-navy-100')}
                aria-hidden
              />
            )}
            <span
              className={clsx(
                'relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white',
                done ? 'bg-teal-600 text-white' : 'bg-navy-100 text-navy-400',
                i === current && ticket.status !== 'closed' && 'ring-teal-100',
              )}
              aria-current={i === current ? 'step' : undefined}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={clsx('mt-1.5 text-xs font-semibold', done ? 'text-navy-900' : 'text-navy-400')}>{label}</span>
            <span className="text-[11px] text-navy-500">{times[i] ? format(new Date(times[i]!), 'd MMM, HH:mm') : '—'}</span>
          </li>
        )
      })}
    </ol>
  )
}
