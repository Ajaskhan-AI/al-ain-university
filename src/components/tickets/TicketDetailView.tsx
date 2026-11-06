import clsx from 'clsx'
import { format, subDays } from 'date-fns'
import {
  ArrowLeft,
  Camera,
  CircleCheckBig,
  Download,
  ExternalLink,
  History,
  Hourglass,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Repeat,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { getBuilding } from '../../data/buildings'
import { CATEGORY_TRADE } from '../../data/tickets'
import AccessRestrictedPage from '../../pages/AccessRestrictedPage'
import { actorFromUser } from '../../lib/actor'
import { formatAgo, formatDateTime, formatDuration } from '../../lib/format'
import { slaTargetLabel, ticketSla, type SlaClock } from '../../lib/sla'
import { CATEGORY_LABELS, SOURCE_LABELS, resolutionMs, responseMs, ticketLocation } from '../../lib/tickets'
import { useNow } from '../../lib/useNow'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { Technician, Ticket } from '../../types'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Field } from '../ui/Field'
import { PhotoInput } from '../ui/PhotoInput'
import { inputClass } from '../ui/styles'
import { useToast } from '../ui/toastContext'
import { CATEGORY_ICONS } from './categoryIcons'
import { SlaBadge } from './SlaBadge'
import { StatusStepper } from './StatusStepper'
import { PriorityBadge, TicketStatusBadge } from './TicketBadges'
import { Timeline } from './Timeline'

interface Props {
  ticketId: string
  /** 'page' = full page with back link; 'panel' = inside the slide-over on the Complaints page. */
  variant: 'page' | 'panel'
  onClose?: () => void
  /** Panel only: open another ticket (e.g. from the room history) in the same panel. */
  onOpenTicket?: (id: string) => void
}

/** Everything about one ticket, with the single next action for the current user front and centre. */
export function TicketDetailView({ ticketId, variant, onClose, onOpenTicket }: Props) {
  const { tickets, rooms, technicians } = useAppState()
  const user = useCurrentUser()
  const toast = useToast()
  const now = useNow()
  const ticket = tickets.find((t) => t.id === ticketId)

  const isTechnician = user?.role === 'technician'
  const backTo = isTechnician ? '/my-jobs' : '/complaints'
  const backLabel = isTechnician ? 'My Jobs' : 'All complaints'

  if (!user) return null
  if (!ticket) {
    return (
      <EmptyState icon={MessageSquare} title={`Ticket ${ticketId} not found`}>
        <Link to={backTo} className="text-teal-700 underline">
          Back to {backLabel}
        </Link>
      </EmptyState>
    )
  }

  // Access: technicians only see their own jobs; single-campus users only their campus.
  const isMine = !!user.technicianId && ticket.assignedTechnicianId === user.technicianId
  const canSee = can(user, 'tickets.view') || (can(user, 'tickets.viewOwn') && isMine)
  if (!canSee || (user.campus !== 'ALL' && ticket.campus !== user.campus)) return <AccessRestrictedPage />

  const tech = technicians.find((t) => t.id === ticket.assignedTechnicianId)
  const panel = variant === 'panel'

  const downloadPdf = async () => {
    // Loaded on demand so the PDF library isn't part of the initial app download.
    const { downloadTicketPdf } = await import('../../pdf/ticketPdf')
    toast.show(`Downloaded ${downloadTicketPdf(ticket, rooms, technicians)}`)
  }

  const header = (
    <div className={clsx('flex flex-wrap items-start justify-between gap-3', panel ? 'mb-4' : 'mt-3 mb-5')}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {panel ? (
            <h2 className="text-2xl font-bold tracking-tight text-navy-900">{ticket.id}</h2>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{ticket.id}</h1>
          )}
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <SlaBadge ticket={ticket} now={now} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-navy-600">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {ticketLocation(ticket, rooms)}
            {ticket.roomId && <span className="text-navy-400"> · {ticket.roomId}</span>}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={downloadPdf}>
          <Download className="size-4" aria-hidden />
          PDF
        </Button>
        {panel && (
          <>
            <Link to={`/complaints/${ticket.id}`} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50" title="Open full page" aria-label="Open full page">
              <ExternalLink className="size-4" />
            </Link>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50" aria-label="Close panel" autoFocus>
              <X className="size-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )

  const progress = (
    <Section>
      <StatusStepper ticket={ticket} />
    </Section>
  )
  const nextStep = <NextStep ticket={ticket} tech={tech} isMine={isMine} />
  const details = <Details ticket={ticket} />
  const sla = <SlaPanel ticket={ticket} now={now} />
  const history = <RoomHistory ticket={ticket} now={now} onOpenTicket={panel ? onOpenTicket : undefined} />
  const timeline = <TimelineSection ticket={ticket} isMine={isMine} />
  const techCard = <TechnicianCard tech={tech} />

  if (panel) {
    return (
      <div>
        {header}
        <div className="space-y-4">
          {progress}
          {nextStep}
          {sla}
          {details}
          {history}
          {timeline}
          {techCard}
        </div>
      </div>
    )
  }

  return (
    <>
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
      {header}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {progress}
          {nextStep}
          {details}
          {timeline}
        </div>
        <div className="space-y-5">
          {sla}
          {techCard}
          {history}
        </div>
      </div>
    </>
  )
}

function Section({ title, icon, children, className }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-xl border border-navy-100 bg-white p-4 shadow-sm', className)}>
      {title && (
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-navy-500 uppercase">
          {icon}
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}

/** The one thing to do next, for this user, given the ticket's status. */
function NextStep({ ticket, tech, isMine }: { ticket: Ticket; tech?: Technician; isMine: boolean }) {
  const { technicians } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [techChoice, setTechChoice] = useState('')
  const [showReassign, setShowReassign] = useState(false)
  const [remark, setRemark] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [remarkError, setRemarkError] = useState(false)
  if (!user) return null

  const actor = actorFromUser(user)
  const canAssign = can(user, 'tickets.assign') && ticket.status !== 'closed'
  const canWork = can(user, 'tickets.update') || (can(user, 'tickets.updateOwn') && isMine)
  const trade = CATEGORY_TRADE[ticket.category]
  const candidates = technicians
    .filter((t) => t.campus === ticket.campus && t.active)
    .sort((a, b) => Number(b.trade === trade) - Number(a.trade === trade))
  const selected = techChoice || candidates.find((t) => t.id !== ticket.assignedTechnicianId)?.id || ''

  const assign = () => {
    const chosen = technicians.find((t) => t.id === selected)
    if (!chosen) return
    dispatch(actions.assignTicket(ticket.id, chosen.id, actor))
    setTechChoice('')
    setShowReassign(false)
    toast.show(`${ticket.id} assigned to ${chosen.name}`)
  }
  const start = () => {
    dispatch(actions.startTicket(ticket.id, actor))
    toast.show(`Work started on ${ticket.id}`, 'info')
  }
  const close = () => {
    if (remark.trim().length < 3) {
      setRemarkError(true)
      return
    }
    dispatch(actions.closeTicket(ticket.id, remark, actor, photo?.name))
    toast.show(`${ticket.id} closed`)
  }

  const assignControl = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor={`assign-${ticket.id}`} className="sr-only">
        Technician
      </label>
      <select id={`assign-${ticket.id}`} value={selected} onChange={(e) => setTechChoice(e.target.value)} className={inputClass}>
        {candidates.map((t) => (
          <option key={t.id} value={t.id} disabled={t.id === ticket.assignedTechnicianId}>
            {t.name} — {t.trade.toUpperCase()}
            {t.trade === trade ? ' ★ suggested' : ''}
            {t.id === ticket.assignedTechnicianId ? ' · current' : ''}
          </option>
        ))}
      </select>
      <Button onClick={assign} disabled={!selected || selected === ticket.assignedTechnicianId} className="shrink-0">
        <UserPlus className="size-4" aria-hidden />
        {ticket.assignedTechnicianId ? 'Reassign' : 'Assign'}
      </Button>
    </div>
  )

  let tone = 'border-teal-200 bg-teal-50/60'
  let body: ReactNode
  if (ticket.status === 'closed') {
    tone = 'border-green-200 bg-green-50/70'
    body = (
      <div className="flex items-start gap-3">
        <CircleCheckBig className="size-6 shrink-0 text-green-600" aria-hidden />
        <div>
          <p className="font-semibold text-navy-900">Closed {ticket.closedAt && formatAgo(ticket.closedAt)}</p>
          {ticket.closeRemark && <p className="text-sm text-navy-700">“{ticket.closeRemark}”</p>}
        </div>
      </div>
    )
  } else if (ticket.status === 'open') {
    body = canAssign ? (
      <>
        <p className="mb-2 font-semibold text-navy-900">Next step: assign a technician</p>
        {assignControl}
      </>
    ) : (
      <Waiting text="Waiting for the helpdesk or an FM engineer to assign a technician." />
    )
  } else if (ticket.status === 'assigned') {
    body = canWork ? (
      <>
        <p className="mb-2 font-semibold text-navy-900">Next step: start the job</p>
        <Button variant="teal" size="lg" onClick={start} className="w-full sm:w-auto">
          <Play className="size-5" aria-hidden />
          Start work
        </Button>
      </>
    ) : (
      <Waiting text={`Waiting for ${tech?.name ?? 'the technician'} to start.`} />
    )
  } else {
    body = canWork ? (
      <div className="space-y-3">
        <p className="font-semibold text-navy-900">Next step: close the job</p>
        <Field label="What was done?" htmlFor={`remark-${ticket.id}`} required error={remarkError ? 'A closing remark is required.' : undefined}>
          <textarea
            id={`remark-${ticket.id}`}
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="e.g. Cleaned FCU filter; cooling restored"
            className={inputClass}
          />
        </Field>
        <Field label="Photo after repair" optional>
          <PhotoInput value={photo} onChange={setPhoto} />
        </Field>
        <Button variant="teal" size="lg" onClick={close} className="w-full sm:w-auto">
          <CircleCheckBig className="size-5" aria-hidden />
          Close ticket
        </Button>
      </div>
    ) : (
      <Waiting text={`${tech?.name ?? 'The technician'} is working on it.`} />
    )
  }

  return (
    <section className={clsx('rounded-xl border p-4', tone)}>
      {body}
      {canAssign && ticket.status !== 'open' && (
        <div className="mt-3 border-t border-teal-200/70 pt-3">
          {showReassign ? (
            assignControl
          ) : (
            <button type="button" onClick={() => setShowReassign(true)} className="text-sm font-medium text-teal-700 hover:underline">
              Reassign to another technician
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function Waiting({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-navy-700">
      <Hourglass className="size-5 shrink-0 text-navy-400" aria-hidden />
      {text}
    </p>
  )
}

function SlaPanel({ ticket, now }: { ticket: Ticket; now: number }) {
  const sla = ticketSla(ticket, now)
  return (
    <Section title="Service level" icon={<Hourglass className="size-4" aria-hidden />}>
      <p className="mb-3 text-xs text-navy-500">{slaTargetLabel(ticket.priority)} ({ticket.priority} priority)</p>
      <div className="space-y-2">
        <ClockRow label="Response" clock={sla.response} actual={ticket.assignedAt ? formatDuration(responseMs(ticket)) : null} />
        <ClockRow label="Resolution" clock={sla.resolution} actual={ticket.closedAt ? formatDuration(resolutionMs(ticket)) : null} />
      </div>
    </Section>
  )
}

function ClockRow({ label, clock, actual }: { label: string; clock: SlaClock; actual: string | null }) {
  const color = clock.status === 'met' ? 'text-green-700' : clock.status === 'breached' ? 'text-red-700' : clock.status === 'at_risk' ? 'text-amber-700' : 'text-navy-700'
  const text = clock.done
    ? `${actual} · ${clock.status === 'met' ? 'met' : 'missed'}`
    : clock.status === 'breached'
      ? `overdue by ${formatDuration(-clock.remainingMs)}`
      : `${formatDuration(clock.remainingMs)} left`
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-navy-50/70 px-3 py-2 text-sm">
      <span className="text-navy-600">{label}</span>
      <span className={clsx('font-semibold tabular-nums', color)}>{text}</span>
    </div>
  )
}

function Details({ ticket }: { ticket: Ticket }) {
  const Icon = CATEGORY_ICONS[ticket.category]
  const building = getBuilding(ticket.buildingId)
  return (
    <Section>
      <div className="flex items-center gap-2 text-sm font-medium text-navy-600">
        <Icon className="size-4" aria-hidden />
        {CATEGORY_LABELS[ticket.category]} · via {SOURCE_LABELS[ticket.source]} · {formatAgo(ticket.createdAt)}
      </div>
      <p className="mt-2 text-lg text-navy-900">{ticket.description}</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Reported by">
          {ticket.requesterName ?? ticket.timeline[0]?.by.name ?? '—'}
          {ticket.requesterPhone && <span className="text-navy-500"> · {ticket.requesterPhone}</span>}
        </Info>
        <Info label="Reported">{formatDateTime(ticket.createdAt)}</Info>
        <Info label="Building">{building?.name ?? ticket.buildingId}</Info>
        {(ticket.smdbId || ticket.assetId) && (
          <Info label="Equipment">
            <Link to={ticket.smdbId ? `/smdb/${ticket.smdbId}` : `/ppm/assets/${ticket.assetId}`} className="font-medium text-teal-700 hover:underline">
              {ticket.smdbId ?? ticket.assetId}
            </Link>
          </Info>
        )}
        {ticket.photoName && (
          <Info label="Photo">
            <span className="inline-flex items-center gap-1">
              <Camera className="size-4" aria-hidden /> {ticket.photoName}
            </span>
          </Info>
        )}
        {ticket.closePhotoName && <Info label="Photo after repair">{ticket.closePhotoName}</Info>}
      </dl>
    </Section>
  )
}

/** Other tickets in the same room — the context for spotting repeat faults. */
function RoomHistory({ ticket, now, onOpenTicket }: { ticket: Ticket; now: number; onOpenTicket?: (id: string) => void }) {
  const { tickets } = useAppState()
  if (!ticket.roomId) return null
  const from = subDays(now, 90).toISOString()
  const others = tickets
    .filter((t) => t.roomId === ticket.roomId && t.id !== ticket.id && t.createdAt >= from)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const last30 = tickets.filter((t) => t.roomId === ticket.roomId && t.createdAt >= subDays(now, 30).toISOString()).length

  return (
    <Section title="This room — last 90 days" icon={<History className="size-4" aria-hidden />}>
      {last30 >= 3 && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-alert-soft px-3 py-2 text-sm font-medium text-red-800">
          <Repeat className="size-4 shrink-0" aria-hidden />
          Repeat-fault room: {last30} tickets in 30 days — consider a root-cause check.
        </p>
      )}
      {others.length === 0 ? (
        <p className="text-sm text-navy-500">No other tickets for this room.</p>
      ) : (
        <ul className="space-y-1.5">
          {others.slice(0, 6).map((t) => {
            const Icon = CATEGORY_ICONS[t.category]
            const content = (
              <>
                <Icon className="size-4 shrink-0 text-navy-400" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-navy-900">{t.id}</span> · {t.description}
                </span>
                <span className="shrink-0 text-xs text-navy-400">{format(new Date(t.createdAt), 'd MMM')}</span>
              </>
            )
            const cls = 'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-navy-700 hover:bg-navy-50'
            return (
              <li key={t.id}>
                {onOpenTicket ? (
                  <button type="button" className={cls} onClick={() => onOpenTicket(t.id)}>
                    {content}
                  </button>
                ) : (
                  <Link to={`/complaints/${t.id}`} className={cls}>
                    {content}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

function TimelineSection({ ticket, isMine }: { ticket: Ticket; isMine: boolean }) {
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const [note, setNote] = useState('')
  const canNote =
    ticket.status !== 'closed' && (can(user, 'tickets.assign') || can(user, 'tickets.update') || (can(user, 'tickets.updateOwn') && isMine))
  const addNote = () => {
    if (!user || !note.trim()) return
    dispatch(actions.addTicketNote(ticket.id, note, actorFromUser(user)))
    setNote('')
  }
  return (
    <Section title="Timeline" icon={<MessageSquare className="size-4" aria-hidden />}>
      <Timeline events={ticket.timeline} />
      {canNote && (
        <div className="mt-4 flex flex-col gap-2 border-t border-navy-50 pt-3 sm:flex-row">
          <label htmlFor={`note-${ticket.id}`} className="sr-only">
            Add a note
          </label>
          <input
            id={`note-${ticket.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            placeholder="Add a note…"
            className={inputClass}
          />
          <Button variant="secondary" onClick={addNote} disabled={!note.trim()} className="shrink-0">
            Add note
          </Button>
        </div>
      )}
    </Section>
  )
}

function TechnicianCard({ tech }: { tech?: Technician }) {
  return (
    <Section title="Technician" icon={<User className="size-4" aria-hidden />}>
      {tech ? (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-navy-900">{tech.name}</p>
          <p className="text-navy-500">{tech.trade.toUpperCase()} technician</p>
          <p className="flex items-center gap-2 text-navy-600">
            <Phone className="size-4" aria-hidden />
            {tech.phone}
          </p>
        </div>
      ) : (
        <p className="text-sm text-navy-500">Not assigned yet.</p>
      )}
    </Section>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-navy-400 uppercase">{label}</dt>
      <dd className="mt-0.5 text-navy-800">{children}</dd>
    </div>
  )
}
