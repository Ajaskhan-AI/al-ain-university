import clsx from 'clsx'
import { format } from 'date-fns'
import { ArrowLeft, Camera, CircleCheck, CircleX, ClipboardCheck, MapPin, Send, TriangleAlert, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { can } from '../../auth/permissions'
import { ROLE_LABELS } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { ASSET_ICONS } from '../../components/ppm/assetIcons'
import { PpmStatusBadge } from '../../components/ppm/PpmTaskList'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { PhotoInput } from '../../components/ui/PhotoInput'
import { inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { getBuilding } from '../../data/buildings'
import { CHECKLIST_TEMPLATES } from '../../data/checklists'
import { actorFromUser } from '../../lib/actor'
import { fromISODate, toISODate } from '../../lib/dates'
import { FREQUENCY_LABELS, canCompletePpm, getPpmStatus, isReadingOutOfRange, isTaskMine } from '../../lib/ppm'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { ChecklistItem, ChecklistResult, PpmCompletion } from '../../types'
import AccessRestrictedPage from '../AccessRestrictedPage'

/** A PPM task: the checklist form (if it is yours to do) or the completed record. */
export default function TaskPage() {
  const { taskId } = useParams()
  const { ppmTasks, assets, technicians } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const toast = useToast()

  const task = ppmTasks.find((t) => t.id === taskId)
  const asset = task ? assets.find((a) => a.id === task.assetId) : undefined

  // Form state (only used while the task is open)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [readings, setReadings] = useState<Record<string, string>>({})
  const [remarks, setRemarks] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [techName, setTechName] = useState(user?.name ?? '')
  const [submitted, setSubmitted] = useState(false)

  const isTechnician = user?.role === 'technician'
  if (!user) return null
  if (!task || !asset) {
    return (
      <EmptyState icon={ClipboardCheck} title={`PPM task ${taskId} not found`}>
        <Link to={isTechnician ? '/my-jobs' : '/ppm'} className="text-teal-700 underline">
          Back
        </Link>
      </EmptyState>
    )
  }
  const canSee = can(user, 'ppm.view') || (can(user, 'ppm.viewOwn') && isTaskMine(user, task))
  if (!canSee || (user.campus !== 'ALL' && asset.campus !== user.campus)) return <AccessRestrictedPage />

  const today = toISODate(new Date())
  const status = getPpmStatus(task, today)
  const items = CHECKLIST_TEMPLATES[asset.category]
  const tech = technicians.find((t) => t.id === task.assignedTechnicianId)
  const Icon = ASSET_ICONS[asset.category]
  const canComplete = canCompletePpm(user, task)

  // ---- validation ----
  const parsed: ChecklistResult = {}
  const missingReadings: string[] = []
  const outOfRange: string[] = []
  const unticked: string[] = []
  for (const item of items) {
    if (item.kind === 'check') {
      parsed[item.id] = !!checks[item.id]
      if (!checks[item.id]) unticked.push(item.label)
    } else {
      const value = Number(readings[item.id])
      if (readings[item.id] === undefined || readings[item.id].trim() === '' || !Number.isFinite(value)) missingReadings.push(item.id)
      else {
        parsed[item.id] = value
        if (isReadingOutOfRange(item, value)) outOfRange.push(item.label)
      }
    }
  }
  const needsRemark = unticked.length > 0 || outOfRange.length > 0
  const remarkMissing = needsRemark && remarks.trim().length < 3
  const nameMissing = techName.trim().length < 2
  const valid = missingReadings.length === 0 && !remarkMissing && !nameMissing

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!valid) return
    dispatch(
      actions.completePpmTask(
        task.id,
        { technicianName: techName, results: parsed, remarks: remarks.trim() || 'All normal.', photoName: photo?.name },
        actorFromUser(user),
      ),
    )
    toast.show(`${task.title} completed — logged to ${asset.id}`)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <Link
        to={isTechnician ? '/my-jobs' : `/ppm/assets/${asset.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {isTechnician ? 'My Jobs' : asset.name}
      </Link>

      <div className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{task.title}</h1>
          <PpmStatusBadge status={status} />
        </div>
        <p className="text-sm text-navy-400">
          {task.id} · {FREQUENCY_LABELS[task.frequency]} · due{' '}
          <span className={clsx(status === 'overdue' && 'font-semibold text-red-700')}>{format(fromISODate(task.dueDate), 'EEE d MMM yyyy')}</span>
          {tech && <> · assigned to {tech.name}</>}
        </p>
        <Link
          to={`/ppm/assets/${asset.id}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3 shadow-sm hover:border-teal-300 sm:inline-flex"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
            <Icon className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-navy-900">{asset.name}</span>
            <span className="flex items-center gap-1 text-xs text-navy-500">
              <span className="font-mono">{asset.id}</span> · <MapPin className="size-3" aria-hidden /> {getBuilding(asset.buildingId)?.shortName}, {asset.location}
            </span>
          </span>
        </Link>
      </div>

      {task.completion ? (
        <CompletedRecord items={items} completion={task.completion} />
      ) : canComplete ? (
        <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
          <Card title="Checklist" subtitle="Tick each item that is OK. Enter every reading.">
            <ul className="space-y-3">
              {items.map((item) =>
                item.kind === 'check' ? (
                  <li key={item.id}>
                    <label
                      className={clsx(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition',
                        checks[item.id] ? 'border-green-300 bg-green-50' : 'border-navy-100 hover:bg-navy-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={!!checks[item.id]}
                        onChange={(e) => setChecks((c) => ({ ...c, [item.id]: e.target.checked }))}
                        className="size-6 shrink-0 accent-teal-600"
                      />
                      <span className="text-navy-900">{item.label}</span>
                    </label>
                  </li>
                ) : (
                  <li key={item.id}>
                    <ReadingInput
                      item={item}
                      value={readings[item.id] ?? ''}
                      onChange={(v) => setReadings((r) => ({ ...r, [item.id]: v }))}
                      showMissing={submitted && missingReadings.includes(item.id)}
                    />
                  </li>
                ),
              )}
            </ul>
          </Card>

          <Card title="Remarks, photo and sign-off">
            <div className="space-y-4">
              {needsRemark && (
                <p className="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-amber-900">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {[unticked.length && `${unticked.length} item(s) not ticked`, outOfRange.length && `${outOfRange.length} reading(s) out of range`]
                    .filter(Boolean)
                    .join(' and ')}{' '}
                  — please explain in the remarks.
                </p>
              )}
              <Field
                label="Remarks"
                htmlFor="remarks"
                required={needsRemark}
                optional={!needsRemark}
                error={submitted && remarkMissing ? 'Explain the unticked items / out-of-range readings.' : undefined}
              >
                <textarea id="remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Photo" optional>
                <PhotoInput value={photo} onChange={setPhoto} />
              </Field>
              <Field label="Technician name" htmlFor="tech-name" required error={submitted && nameMissing ? 'Enter your name.' : undefined}>
                <input id="tech-name" value={techName} onChange={(e) => setTechName(e.target.value)} className={inputClass} />
              </Field>
              {submitted && !valid && <p className="text-sm font-medium text-red-700">Please fix the highlighted fields.</p>}
              <Button type="submit" variant="teal" size="lg" className="w-full sm:w-auto">
                <Send className="size-5" aria-hidden />
                Submit checklist
              </Button>
            </div>
          </Card>
        </form>
      ) : (
        <Card title="Checklist">
          <p className="mb-3 text-sm text-navy-500">
            {can(user, 'ppm.completeOwn') || can(user, 'ppm.complete')
              ? 'This task is assigned to another technician.'
              : `${ROLE_LABELS[user.role]} users can view this checklist; the assigned technician or an FM engineer completes it.`}
          </p>
          <TemplateList items={items} />
        </Card>
      )}
    </>
  )
}

/** Read-only view of a submitted checklist. */
function CompletedRecord({ items: list, completion }: { items: ChecklistItem[]; completion: PpmCompletion }) {
  return (
    <div className="max-w-3xl space-y-6">
      <Card title="Completed checklist" subtitle={`Submitted ${format(new Date(completion.at), 'd MMM yyyy, HH:mm')}`}>
        <ul className="divide-y divide-navy-50">
          {list.map((item) => {
            const value = completion.results[item.id]
            const out = isReadingOutOfRange(item, value)
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-navy-800">
                  {item.kind === 'check' ? (
                    value ? (
                      <CircleCheck className="size-5 text-green-600" aria-label="OK" />
                    ) : (
                      <CircleX className="size-5 text-red-600" aria-label="Not OK" />
                    )
                  ) : (
                    <span className="size-5" />
                  )}
                  {item.label}
                </span>
                {item.kind === 'reading' && (
                  <span className="flex items-center gap-2 text-right">
                    <span className="font-semibold tabular-nums text-navy-900">
                      {typeof value === 'number' ? value : '—'} {item.unit}
                    </span>
                    {out ? <Badge tone="warn">out of range</Badge> : <span className="text-xs text-navy-400">({item.min}–{item.max})</span>}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
      <Card title="Sign-off">
        <dl className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <User className="mt-0.5 size-4 text-navy-400" aria-hidden />
            <span>
              <span className="font-semibold text-navy-900">{completion.technicianName}</span>{' '}
              <span className="text-navy-500">
                · logged by {completion.by.name}
                {completion.by.role !== 'requester' && completion.by.role !== 'system' && ` (${ROLE_LABELS[completion.by.role]})`}
              </span>
            </span>
          </div>
          <p className="rounded-lg bg-navy-50 px-3 py-2 text-navy-800">{completion.remarks}</p>
          {completion.photoName && (
            <p className="flex items-center gap-2 text-navy-600">
              <Camera className="size-4" aria-hidden /> {completion.photoName}
            </p>
          )}
        </dl>
      </Card>
    </div>
  )
}

function ReadingInput({
  item,
  value,
  onChange,
  showMissing,
}: {
  item: Extract<ChecklistItem, { kind: 'reading' }>
  value: string
  onChange: (value: string) => void
  showMissing: boolean
}) {
  const id = `reading-${item.id}`
  const number = Number(value)
  const out = value.trim() !== '' && Number.isFinite(number) && isReadingOutOfRange(item, number)
  return (
    <div className={clsx('rounded-xl border p-3', out ? 'border-amber-300 bg-amber-50' : showMissing ? 'border-red-300 bg-red-50' : 'border-navy-100')}>
      <label htmlFor={id} className="flex flex-wrap items-center justify-between gap-1 text-navy-900">
        {item.label}
        <span className="text-xs text-navy-500">
          normal {item.min}–{item.max} {item.unit}
        </span>
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(inputClass, 'max-w-40 text-lg tabular-nums')}
        />
        <span className="font-medium text-navy-600">{item.unit}</span>
        {out && <Badge tone="warn">out of range</Badge>}
      </div>
      {showMissing && <p className="mt-1 text-xs font-medium text-red-700">Enter this reading.</p>}
    </div>
  )
}

function TemplateList({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-navy-700">
      {items.map((item) => (
        <li key={item.id}>
          • {item.label}
          {item.kind === 'reading' && (
            <span className="text-navy-400">
              {' '}
              ({item.min}–{item.max} {item.unit})
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
