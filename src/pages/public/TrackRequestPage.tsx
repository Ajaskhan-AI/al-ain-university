import { format } from 'date-fns'
import { CircleCheckBig, Hourglass, MapPin, Search, Wrench } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { PublicShell } from '../../components/layout/PublicShell'
import { StatusStepper } from '../../components/tickets/StatusStepper'
import { Button } from '../../components/ui/Button'
import { inputClass } from '../../components/ui/styles'
import { CATEGORY_TRADE } from '../../data/tickets'
import { formatAgo } from '../../lib/format'
import { ticketSla } from '../../lib/sla'
import { CATEGORY_LABELS, REQUESTER_STEP_LABELS, ticketLocation } from '../../lib/tickets'
import { useAppState } from '../../store/hooks'

const TRADE_LABEL = { hvac: 'An HVAC technician', electrical: 'An electrician', plumbing: 'A plumber', general: 'A general technician' }

/**
 * Public "Track my request" page: enter a ticket number and see its progress.
 * Shows only what a requester needs — no internal notes or staff phone numbers.
 */
export default function TrackRequestPage() {
  const { ticketId = '' } = useParams()
  const { tickets, rooms } = useAppState()
  const navigate = useNavigate()
  const [input, setInput] = useState(ticketId)

  const id = ticketId.trim().toUpperCase()
  const ticket = id ? tickets.find((t) => t.id === id) : undefined

  const lookup = (event: FormEvent) => {
    event.preventDefault()
    const value = input.trim().toUpperCase().replace(/^(\d+)$/, 'WO-$1')
    if (value) navigate(`/track/${value}`)
  }

  let message = ''
  if (ticket) {
    const trade = TRADE_LABEL[CATEGORY_TRADE[ticket.category]]
    message =
      ticket.status === 'open'
        ? 'Your request is with the FM team and will be assigned to a technician shortly.'
        : ticket.status === 'assigned'
          ? `${trade} has been assigned and will attend soon.`
          : ticket.status === 'in_progress'
            ? `${trade} is working on it now.`
            : 'The problem has been fixed. Thank you for reporting it!'
  }
  const due = ticket && !ticket.closedAt ? ticketSla(ticket).resolution.targetAt : null

  return (
    <PublicShell title="Track a request">
      <form onSubmit={lookup} className="flex gap-2">
        <label htmlFor="ticket-no" className="sr-only">
          Ticket number
        </label>
        <input
          id="ticket-no"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ticket number, e.g. WO-1031"
          autoCapitalize="characters"
          className={`${inputClass} py-3 text-lg uppercase`}
        />
        <Button type="submit" variant="teal" size="lg">
          <Search className="size-5" aria-hidden />
          <span className="sr-only sm:not-sr-only">Track</span>
        </Button>
      </form>

      {id && !ticket && (
        <p className="mt-4 rounded-xl bg-white p-4 text-navy-700 shadow-sm">
          We couldn’t find <strong>{id}</strong>. Check the number on your confirmation screen.
        </p>
      )}

      {ticket && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-navy-900">{ticket.id}</p>
              <span className="text-sm text-navy-500">reported {formatAgo(ticket.createdAt)}</span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-600">
              <MapPin className="size-4" aria-hidden />
              {ticketLocation(ticket, rooms)}
            </p>
            <p className="mt-1 text-sm text-navy-600">
              {CATEGORY_LABELS[ticket.category]} · {ticket.description}
            </p>
            <div className="mt-5">
              <StatusStepper ticket={ticket} labels={REQUESTER_STEP_LABELS} />
            </div>
          </div>

          <div className={ticket.status === 'closed' ? 'rounded-2xl border border-green-200 bg-green-50 p-5' : 'rounded-2xl border border-teal-200 bg-teal-50 p-5'}>
            <p className="flex items-start gap-3 font-medium text-navy-900">
              {ticket.status === 'closed' ? (
                <CircleCheckBig className="size-6 shrink-0 text-green-600" aria-hidden />
              ) : ticket.status === 'open' ? (
                <Hourglass className="size-6 shrink-0 text-teal-700" aria-hidden />
              ) : (
                <Wrench className="size-6 shrink-0 text-teal-700" aria-hidden />
              )}
              {message}
            </p>
            {ticket.closeRemark && <p className="mt-2 text-sm text-navy-700">What was done: “{ticket.closeRemark}”</p>}
            {due && <p className="mt-2 text-sm text-navy-600">Target to fix by {format(due, 'EEE d MMM, HH:mm')}.</p>}
          </div>
        </div>
      )}
    </PublicShell>
  )
}
