import { UserPlus } from 'lucide-react'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CATEGORY_TRADE } from '../../data/tickets'
import { actorFromUser } from '../../lib/actor'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { Ticket } from '../../types'
import { useToast } from '../ui/toastContext'

/**
 * Assign a technician straight from the board or list, without opening the
 * ticket. Same-campus technicians, matching trade first.
 */
export function QuickAssign({ ticket }: { ticket: Ticket }) {
  const { technicians } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const trade = CATEGORY_TRADE[ticket.category]
  const options = technicians
    .filter((t) => t.campus === ticket.campus && t.active)
    .sort((a, b) => Number(b.trade === trade) - Number(a.trade === trade))

  return (
    <label
      className="relative inline-flex items-center"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span className="sr-only">Assign {ticket.id}</span>
      <UserPlus className="pointer-events-none absolute left-2 size-3.5 text-teal-700" aria-hidden />
      <select
        value=""
        onChange={(e) => {
          const tech = technicians.find((t) => t.id === e.target.value)
          if (!tech || !user) return
          dispatch(actions.assignTicket(ticket.id, tech.id, actorFromUser(user)))
          toast.show(`${ticket.id} assigned to ${tech.name}`)
        }}
        className="w-full cursor-pointer appearance-none rounded-md border border-teal-300 bg-teal-50 py-1 pr-2 pl-7 text-xs font-semibold text-teal-800 hover:bg-teal-100 focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
      >
        <option value="" disabled>
          Assign technician…
        </option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {t.trade.toUpperCase()}
            {t.trade === trade ? ' ★ suggested' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
