import { subDays } from 'date-fns'
import { ChevronRight, ClipboardCheck, Inbox, ScanQrCode } from 'lucide-react'
import { Link } from 'react-router'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { PpmTaskList } from '../../components/ppm/PpmTaskList'
import { CATEGORY_ICONS } from '../../components/tickets/categoryIcons'
import { PriorityBadge, TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { EmptyState } from '../../components/ui/EmptyState'
import { buttonClass } from '../../components/ui/styles'
import { toISODate } from '../../lib/dates'
import { formatAgo } from '../../lib/format'
import { getPpmStatus, isTaskMine } from '../../lib/ppm'
import { sortTicketsForWork, ticketLocation } from '../../lib/tickets'
import { useAppState } from '../../store/hooks'
import type { Ticket } from '../../types'

/** Technician home (mobile): work orders and PPM tasks assigned to me. */
export default function MyJobsPage() {
  const user = useCurrentUser()
  const { tickets, rooms, ppmTasks } = useAppState()
  const today = toISODate(new Date())
  const weekAgo = subDays(new Date(), 7).toISOString()

  const mine = tickets.filter((t) => !!user?.technicianId && t.assignedTechnicianId === user.technicianId)
  const todo = mine.filter((t) => t.status !== 'closed').sort(sortTicketsForWork)
  const closedTickets = mine.filter((t) => t.status === 'closed' && (t.closedAt ?? '') >= weekAgo)

  // PPM: everything not done, plus anything due in the next 7 days; overdue first.
  const myPpm = ppmTasks.filter((t) => isTaskMine(user, t))
  const nextWeek = toISODate(subDays(new Date(), -7))
  const ppmTodo = myPpm
    .filter((t) => !t.completion && t.dueDate <= nextWeek)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const ppmOverdue = ppmTodo.filter((t) => getPpmStatus(t, today) === 'overdue').length
  const ppmDoneWeek = myPpm.filter((t) => (t.completion?.at ?? '') >= weekAgo).length

  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">My Jobs</h1>
      <p className="mt-1 text-navy-500">Hello {user?.name.split(' ')[0]} — here is what is assigned to you.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat value={todo.length} label="Work orders" />
        <Stat value={ppmTodo.length} label={ppmOverdue ? `PPM · ${ppmOverdue} overdue` : 'PPM tasks'} alert={ppmOverdue > 0} />
        <Stat value={closedTickets.length + ppmDoneWeek} label="Done this week" />
      </div>

      <Link to="/ppm/scan" className={buttonClass('teal', 'lg', 'mt-4 w-full')}>
        <ScanQrCode className="size-5" aria-hidden />
        Scan an asset QR
      </Link>

      <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-navy-500 uppercase">Work orders</h2>
      {todo.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState icon={Inbox} title="No open work orders" />
        </div>
      ) : (
        <ul className="space-y-2">
          {todo.map((t) => (
            <JobCard key={t.id} ticket={t} location={ticketLocation(t, rooms)} />
          ))}
        </ul>
      )}

      <h2 className="mt-6 mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-wide text-navy-500 uppercase">
        <ClipboardCheck className="size-4" aria-hidden /> PPM tasks — overdue and next 7 days
      </h2>
      {ppmTodo.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState icon={ClipboardCheck} title="No PPM tasks due" />
        </div>
      ) : (
        <PpmTaskList tasks={ppmTodo} today={today} />
      )}

      {closedTickets.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-navy-500 uppercase">Work orders closed this week</h2>
          <ul className="space-y-2">
            {closedTickets.map((t) => (
              <JobCard key={t.id} ticket={t} location={ticketLocation(t, rooms)} />
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function Stat({ value, label, alert = false }: { value: number; label: string; alert?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className={alert ? 'text-2xl font-bold text-red-600' : 'text-2xl font-bold text-navy-900'}>{value}</p>
      <p className="text-xs leading-tight text-navy-500">{label}</p>
    </div>
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
