import { addDays } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { actorFromUser } from '../../lib/actor'
import { filterByCampus } from '../../lib/campus'
import { toISODate } from '../../lib/dates'
import { FREQUENCIES, FREQUENCY_LABELS, defaultTaskTitle, formatPpmId } from '../../lib/ppm'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { PpmFrequency } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { inputClass } from '../ui/styles'

interface Props {
  /** Pre-select an asset (when opened from an asset page). */
  assetId?: string
  onClose: () => void
  onCreated: (taskId: string) => void
}

/** Schedule a PPM task for an asset and assign a technician. */
export function AddTaskModal({ assetId: initialAssetId, onClose, onCreated }: Props) {
  const { assets, technicians, campus, counters } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const campusAssets = filterByCampus(assets, campus)

  const [assetId, setAssetId] = useState(initialAssetId ?? campusAssets[0]?.id ?? '')
  const [frequency, setFrequency] = useState<PpmFrequency>('monthly')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(toISODate(addDays(new Date(), 7)))
  /** null = use the suggested technician; 'none' = leave unassigned. */
  const [techId, setTechId] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const asset = assets.find((a) => a.id === assetId)
  const campusTechs = asset ? technicians.filter((t) => t.campus === asset.campus && t.active) : []
  // Default technician: same trade as the asset.
  const suggested = campusTechs.find((t) => t.trade === asset?.trade)?.id ?? 'none'
  const selectedTech = techId ?? suggested
  const effectiveTitle = title.trim() || (asset ? defaultTaskTitle(asset.category, frequency) : '')
  const valid = !!asset && !!dueDate && !!effectiveTitle

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (!valid || !asset || !user) return
    const id = formatPpmId(counters.ppm)
    dispatch(
      actions.createPpmTask({
        id,
        assetId: asset.id,
        title: effectiveTitle,
        frequency,
        dueDate,
        ...(selectedTech !== 'none' ? { assignedTechnicianId: selectedTech } : {}),
        source: 'manual',
        by: actorFromUser(user),
      }),
    )
    onCreated(id)
  }

  return (
    <Modal
      title="Add PPM task"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-task-form" variant="teal">
            Add task
          </Button>
        </>
      }
    >
      <form id="add-task-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Asset" htmlFor="at-asset" required error={showErrors && !asset ? 'Choose an asset.' : undefined}>
          <select
            id="at-asset"
            value={assetId}
            onChange={(e) => {
              setAssetId(e.target.value)
              setTechId(null)
            }}
            className={inputClass}
          >
            {campusAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Frequency" htmlFor="at-freq" required>
            <select id="at-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as PpmFrequency)} className={inputClass}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date" htmlFor="at-due" required error={showErrors && !dueDate ? 'Pick a date.' : undefined}>
            <input id="at-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Task title" htmlFor="at-title" hint={`Leave empty to use “${asset ? defaultTaskTitle(asset.category, frequency) : ''}”`}>
          <input id="at-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Assign to" htmlFor="at-tech">
          <select id="at-tech" value={selectedTech} onChange={(e) => setTechId(e.target.value)} className={inputClass}>
            <option value="none">Unassigned</option>
            {campusTechs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.trade.toUpperCase()}
                {t.trade === asset?.trade ? ' (suggested)' : ''}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  )
}
