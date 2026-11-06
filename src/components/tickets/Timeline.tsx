import clsx from 'clsx'
import { CircleCheck, MessageSquare, Play, Plus, Repeat, UserPlus, type LucideIcon } from 'lucide-react'
import { ROLE_LABELS } from '../../auth/roles'
import { formatDateTime } from '../../lib/format'
import type { Actor, TimelineEvent, TimelineEventType } from '../../types'

const EVENT_META: Record<TimelineEventType, { label: string; icon: LucideIcon; color: string }> = {
  created: { label: 'Reported', icon: Plus, color: 'bg-red-100 text-red-700' },
  assigned: { label: 'Assigned', icon: UserPlus, color: 'bg-amber-100 text-amber-700' },
  reassigned: { label: 'Reassigned', icon: Repeat, color: 'bg-amber-100 text-amber-700' },
  started: { label: 'Work started', icon: Play, color: 'bg-sky-100 text-sky-700' },
  closed: { label: 'Closed', icon: CircleCheck, color: 'bg-green-100 text-green-700' },
  note: { label: 'Note', icon: MessageSquare, color: 'bg-navy-100 text-navy-700' },
}

function actorRoleLabel(actor: Actor): string {
  if (actor.role === 'requester') return 'Requester'
  if (actor.role === 'system') return 'System'
  return ROLE_LABELS[actor.role]
}

/** Ticket history: who did what, and when. */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-5">
      {events.map((event, index) => {
        const meta = EVENT_META[event.type]
        const Icon = meta.icon
        return (
          <li key={event.id} className="relative flex gap-3">
            {index < events.length - 1 && (
              <span className="absolute top-9 bottom-[-1.25rem] left-4 w-px bg-navy-100" aria-hidden />
            )}
            <span className={clsx('relative flex size-8 shrink-0 items-center justify-center rounded-full', meta.color)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-navy-900">
                <span className="font-semibold">{meta.label}</span> by {event.by.name}{' '}
                <span className="text-navy-400">· {actorRoleLabel(event.by)}</span>
              </p>
              <p className="text-xs text-navy-500">{formatDateTime(event.at)}</p>
              {event.note && <p className="mt-1 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">{event.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
