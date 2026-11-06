import { ArrowLeft, Camera, CircleCheck, Download, MapPin, MessageSquare, Phone, Play, User, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CATEGORY_ICONS } from '../../components/tickets/categoryIcons'
import { PriorityBadge, TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { Timeline } from '../../components/tickets/Timeline'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { PhotoInput } from '../../components/ui/PhotoInput'
import { inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { getBuilding } from '../../data/buildings'
import { CATEGORY_TRADE } from '../../data/tickets'
import { actorFromUser } from '../../lib/actor'
import { formatDateTime, formatDuration } from '../../lib/format'
import { CATEGORY_LABELS, SOURCE_LABELS, resolutionMs, responseMs, ticketLocation } from '../../lib/tickets'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import AccessRestrictedPage from '../AccessRestrictedPage'

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const { tickets, rooms, technicians } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const toast = useToast()

  const ticket = tickets.find((t) => t.id === ticketId)

  const [techChoice, setTechChoice] = useState('')
  const [remark, setRemark] = useState('')
  const [closePhoto, setClosePhoto] = useState<File | null>(null)
  const [remarkError, setRemarkError] = useState(false)
  const [note, setNote] = useState('')

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

  const canAssign = can(user, 'tickets.assign') && ticket.status !== 'closed'
  const canWork = can(user, 'tickets.update') || (can(user, 'tickets.updateOwn') && isMine)
  const canNote = (canAssign || canWork) && ticket.status !== 'closed'
  const actor = actorFromUser(user)

  const tech = technicians.find((t) => t.id === ticket.assignedTechnicianId)
  const building = getBuilding(ticket.buildingId)
  const suggestedTrade = CATEGORY_TRADE[ticket.category]
  // Same-campus technicians, the matching trade first.
  const candidates = technicians
    .filter((t) => t.campus === ticket.campus && t.active)
    .sort((a, b) => Number(b.trade === suggestedTrade) - Number(a.trade === suggestedTrade))
  const selectedTech = techChoice || candidates.find((t) => t.id !== ticket.assignedTechnicianId)?.id || ''
  const CategoryIcon = CATEGORY_ICONS[ticket.category]

  const assign = () => {
    const chosen = technicians.find((t) => t.id === selectedTech)
    if (!chosen) return
    dispatch(actions.assignTicket(ticket.id, chosen.id, actor))
    setTechChoice('')
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
    dispatch(actions.closeTicket(ticket.id, remark, actor, closePhoto?.name))
    setRemark('')
    setClosePhoto(null)
    setRemarkError(false)
    toast.show(`${ticket.id} closed`)
  }

  const addNote = () => {
    if (!note.trim()) return
    dispatch(actions.addTicketNote(ticket.id, note, actor))
    setNote('')
  }

  const downloadPdf = async () => {
    // Loaded on demand so the PDF library isn't part of the initial app download.
    const { downloadTicketPdf } = await import('../../pdf/ticketPdf')
    toast.show(`Downloaded ${downloadTicketPdf(ticket, rooms, technicians)}`)
  }

  return (
    <>
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{ticket.id}</h1>
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-navy-600">
            <MapPin className="size-4" aria-hidden />
            {ticketLocation(ticket, rooms)}
            {ticket.roomId && <span className="text-navy-400">· {ticket.roomId}</span>}
          </p>
        </div>
        <Button variant="secondary" onClick={downloadPdf}>
          <Download className="size-4" aria-hidden />
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Complaint">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-600">
              <CategoryIcon className="size-4" aria-hidden />
              {CATEGORY_LABELS[ticket.category]} · via {SOURCE_LABELS[ticket.source]}
            </div>
            <p className="mt-2 text-lg text-navy-900">{ticket.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Reported by">
                {ticket.requesterName ?? ticket.timeline[0]?.by.name ?? '—'}
                {ticket.requesterPhone && <span className="text-navy-500"> · {ticket.requesterPhone}</span>}
              </Info>
              <Info label="Building">{building?.name ?? ticket.buildingId}</Info>
              {(ticket.smdbId || ticket.assetId) && (
                <Info label="Equipment">
                  <Link
                    to={ticket.smdbId ? `/smdb/${ticket.smdbId}` : `/ppm/assets/${ticket.assetId}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
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
              {ticket.closeRemark && <Info label="Closing remark">{ticket.closeRemark}</Info>}
              {ticket.closePhotoName && <Info label="Closing photo">{ticket.closePhotoName}</Info>}
            </dl>
          </Card>

          {(canAssign || canWork) && (
            <Card title="Actions">
              <div className="space-y-5">
                {canAssign && (
                  <div>
                    <Field label={tech ? 'Reassign technician' : 'Assign technician'} htmlFor="assign-tech">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          id="assign-tech"
                          value={selectedTech}
                          onChange={(e) => setTechChoice(e.target.value)}
                          className={inputClass}
                        >
                          {candidates.map((t) => (
                            <option key={t.id} value={t.id} disabled={t.id === ticket.assignedTechnicianId}>
                              {t.name} — {t.trade.toUpperCase()}
                              {t.trade === suggestedTrade ? ' (suggested)' : ''}
                              {t.id === ticket.assignedTechnicianId ? ' · current' : ''}
                            </option>
                          ))}
                        </select>
                        <Button onClick={assign} disabled={!selectedTech || selectedTech === ticket.assignedTechnicianId} className="shrink-0">
                          <UserPlus className="size-4" aria-hidden />
                          {tech ? 'Reassign' : 'Assign'}
                        </Button>
                      </div>
                    </Field>
                  </div>
                )}

                {canWork && ticket.status === 'assigned' && (
                  <Button variant="teal" size="lg" onClick={start} className="w-full sm:w-auto">
                    <Play className="size-5" aria-hidden />
                    Start work
                  </Button>
                )}

                {canWork && ticket.status === 'in_progress' && (
                  <div className="space-y-3 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                    <p className="font-semibold text-navy-900">Close this ticket</p>
                    <Field label="What was done?" htmlFor="close-remark" required error={remarkError ? 'A closing remark is required.' : undefined}>
                      <textarea
                        id="close-remark"
                        rows={3}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="e.g. Cleaned FCU filter; cooling restored"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Photo after repair" optional>
                      <PhotoInput value={closePhoto} onChange={setClosePhoto} />
                    </Field>
                    <Button variant="teal" size="lg" onClick={close} className="w-full sm:w-auto">
                      <CircleCheck className="size-5" aria-hidden />
                      Close ticket
                    </Button>
                  </div>
                )}

                {canWork && ticket.status === 'open' && (
                  <p className="text-sm text-navy-500">Assign a technician first, then the job can be started.</p>
                )}
                {!canWork && ticket.status !== 'open' && ticket.status !== 'closed' && (
                  <p className="text-sm text-navy-500">The assigned technician or an FM engineer starts and closes the job.</p>
                )}
              </div>
            </Card>
          )}

          <Card title="Timeline" subtitle="Every action with who did it and when">
            <Timeline events={ticket.timeline} />
            {canNote && (
              <div className="mt-5 flex flex-col gap-2 border-t border-navy-50 pt-4 sm:flex-row">
                <label htmlFor="ticket-note" className="sr-only">
                  Add a note
                </label>
                <input
                  id="ticket-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note…"
                  className={inputClass}
                />
                <Button variant="secondary" onClick={addNote} disabled={!note.trim()} className="shrink-0">
                  <MessageSquare className="size-4" aria-hidden />
                  Add note
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Times">
            <dl className="space-y-3 text-sm">
              <Info label="Reported">{formatDateTime(ticket.createdAt)}</Info>
              <Info label="Response time">
                {ticket.assignedAt ? formatDuration(responseMs(ticket)) : <span className="text-red-600">Waiting for assignment</span>}
              </Info>
              {ticket.startedAt && <Info label="Work started">{formatDateTime(ticket.startedAt)}</Info>}
              <Info label="Resolution time">{ticket.closedAt ? formatDuration(resolutionMs(ticket)) : '—'}</Info>
            </dl>
          </Card>

          <Card title="Technician">
            {tech ? (
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2 font-semibold text-navy-900">
                  <User className="size-4" aria-hidden />
                  {tech.name}
                </p>
                <p className="text-navy-500">{tech.trade.toUpperCase()} technician</p>
                <p className="flex items-center gap-2 text-navy-600">
                  <Phone className="size-4" aria-hidden />
                  {tech.phone}
                </p>
              </div>
            ) : (
              <p className="text-sm text-navy-500">Not assigned yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
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
