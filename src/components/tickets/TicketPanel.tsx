import { useEffect } from 'react'
import { TicketDetailView } from './TicketDetailView'

/**
 * Slide-over panel on the right of the Complaints page. Keeps the board/list
 * visible behind it, so triage is fast. Escape or the backdrop closes it.
 */
export function TicketPanel({ ticketId, onClose, onOpenTicket }: { ticketId: string; onClose: () => void; onOpenTicket: (id: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${ticketId}`}
        className="relative h-full w-full max-w-xl overflow-y-auto bg-navy-50 p-5 shadow-2xl sm:p-6"
      >
        {/* key: switching tickets starts with a fresh form (no half-typed remark carried over) */}
        <TicketDetailView key={ticketId} ticketId={ticketId} variant="panel" onClose={onClose} onOpenTicket={onOpenTicket} />
      </aside>
    </div>
  )
}
