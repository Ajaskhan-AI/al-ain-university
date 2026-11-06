import { subDays } from 'date-fns'
import { ChevronRight, ClipboardCheck, Inbox } from 'lucide-react'
import { Link } from 'react-router'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CATEGORY_ICONS } from '../../components/tickets/categoryIcons'
import { PriorityBadge, TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { ComingSoon } from '../../components/ui/ComingSoon'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatAgo } from '../../lib/format'
import { sortTicketsForWork, ticketLocation } from '../../lib/tickets'
import { useAppState } from '../../store/hooks'
import type { Ticket } from '../../types'

/** Technician home (mobile): work orders assigned to me. PPM tasks join in step 5. */
export default function MyJobsPage() {
  const user = useCurrentUser()
  const { tickets, rooms } = useAppState()

  const mine = tickets.filter((t) => !!user?.technicianId && t.assignedTechnicianId === user.technicianId)
  const todo = mine.filter((t) => t.status !== 'closed').sort(sortTicketsForWork)
  const weekAgo = subDays(new Date(), 7).toISOString()
  const doneRecently = mine
    .filter((t) => t.status === 'closed' && (t.closedAt ?? '') >= weekAgo)
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))

  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">My Jobs</h1>
      <p className="mt-1 text-navy-500">Hello {user?.name.split(' ')[0]} — here is what is assigned to you.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-3xl font-bold text-navy-900">{todo.length}</p>
          <p className="text-sm text-navy-500">Work orders to do</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-3xl font-bold text-navy-900">{doneRecently.length}</p>
          <p className="text-sm text-navy-500">Closed this week</p>
        </div>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-navy-500 uppercase">Work orders</h2>
      {todo.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState icon={Inbox} title="Nothing assigned right now" />
        </div>
      ) : (
        <ul className="space-y-2">
          {todo.map((t) => (
            <JobCard key={t.id} ticket={t} location={ticketLocation(t, rooms)} />
          ))}
        </ul>
      )}

      <h2 className="mt-6 mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-wide text-navy-500 uppercase">
        <ClipboardCheck className="size-4" aria-hidden /> PPM tasks
      </h2>
      <ComingSoon step={5} features={['Your planned maintenance tasks and checklists']} />

      {doneRecently.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-navy-500 uppercase">Closed this week</h2>
          <ul className="space-y-2">
            {doneRecently.map((t) => (
              <JobCard key={t.id} ticket={t} location={ticketLocation(t, rooms)} />
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function JobCard({ ticket, location }: { ticket: Ticket; location: string }) {
  const Icon = CATEGORY_ICONS[ticket.category]
  return (
    <li>
      <Link to={`/complaints/${ticket.id}`} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm active:bg-navy-50">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-navy-900">{ticket.id}</span>
            <TicketStatusBadge status={ticket.status} />
            {ticket.priority === 'high' && <PriorityBadge priority="high" />}
          </span>
          <span className="mt-0.5 block truncate text-sm text-navy-700">{ticket.description}</span>
          <span className="block truncate text-xs text-navy-500">
            {location} · {formatAgo(ticket.createdAt)}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-navy-300" aria-hidden />
      </Link>
    </li>
  )
}
