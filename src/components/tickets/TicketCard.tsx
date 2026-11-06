import clsx from 'clsx'
import { formatAgo } from '../../lib/format'
import { ticketLocation } from '../../lib/tickets'
import { useAppState } from '../../store/hooks'
import type { Ticket } from '../../types'
import { CATEGORY_ICONS } from './categoryIcons'
import { QuickAssign } from './QuickAssign'
import { SlaBadge } from './SlaBadge'

const PRIORITY_BAR = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-navy-200' }

/** Card on the board. Click opens the side panel; open tickets can be assigned in place. */
export function TicketCard({ ticket, now, canAssign, onOpen }: { ticket: Ticket; now: number; canAssign: boolean; onOpen: () => void }) {
  const { rooms, technicians } = useAppState()
  const Icon = CATEGORY_ICONS[ticket.category]
  const tech = technicians.find((t) => t.id === ticket.assignedTechnicianId)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className="relative cursor-pointer overflow-hidden rounded-xl border border-navy-100 bg-white p-3 pl-4 shadow-sm transition hover:border-teal-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
      aria-label={`${ticket.id}: ${ticket.description}`}
    >
      <span className={clsx('absolute inset-y-0 left-0 w-1', PRIORITY_BAR[ticket.priority])} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
          <Icon className="size-4 text-navy-500" aria-hidden />
          {ticket.id}
        </span>
        <span className="text-xs text-navy-400">{formatAgo(ticket.createdAt)}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-navy-800">{ticket.description}</p>
      <p className="mt-1 truncate text-xs text-navy-500">{ticketLocation(ticket, rooms)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <SlaBadge ticket={ticket} now={now} />
        {tech && (
          <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">
            <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {tech.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </span>
            {tech.name.split(' ')[0]}
          </span>
        )}
      </div>
      {ticket.status === 'open' && canAssign && (
        <div className="mt-2">
          <QuickAssign ticket={ticket} />
        </div>
      )}
    </article>
  )
}
