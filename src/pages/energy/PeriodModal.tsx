import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { inputClass } from '../../components/ui/styles'
import { DAY_TYPE_LABELS } from '../../lib/calendar'
import type { AcademicPeriod, PeriodType } from '../../types'

const TYPES: PeriodType[] = ['teaching', 'exams', 'ramadan', 'break', 'summer', 'holiday']

/** Add or edit an academic period. */
export function PeriodModal({
  period,
  nextId,
  onSave,
  onClose,
}: {
  period?: AcademicPeriod
  nextId: string
  onSave: (period: AcademicPeriod) => void
  onClose: () => void
}) {
  const [name, setName] = useState(period?.name ?? '')
  const [type, setType] = useState<PeriodType>(period?.type ?? 'holiday')
  const [start, setStart] = useState(period?.start ?? '')
  const [end, setEnd] = useState(period?.end ?? '')
  const [showErrors, setShowErrors] = useState(false)

  const errors = {
    name: name.trim().length < 2 ? 'Enter a name.' : undefined,
    start: !start ? 'Pick a start date.' : undefined,
    end: !end ? 'Pick an end date.' : end < start ? 'End must be on or after the start.' : undefined,
  }
  const valid = !errors.name && !errors.start && !errors.end

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (!valid) return
    onSave({ id: period?.id ?? nextId, name: name.trim(), type, start, end })
  }

  return (
    <Modal
      title={period ? 'Edit period' : 'Add period'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="period-form" variant="teal">
            Save
          </Button>
        </>
      }
    >
      <form id="period-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name" htmlFor="pm-name" required error={showErrors ? errors.name : undefined}>
          <input id="pm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. University open day" className={inputClass} />
        </Field>
        <Field label="Period type" htmlFor="pm-type" required>
          <select id="pm-type" value={type} onChange={(e) => setType(e.target.value as PeriodType)} className={inputClass}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {DAY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start" htmlFor="pm-start" required error={showErrors ? errors.start : undefined}>
            <input id="pm-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </Field>
          <Field label="End (inclusive)" htmlFor="pm-end" required error={showErrors ? errors.end : undefined}>
            <input id="pm-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="text-xs text-navy-500">
          Overlaps are allowed (e.g. Ramadan inside a semester). Priority: holiday › exams › Ramadan › break › summer › teaching. Weekends are added automatically.
        </p>
      </form>
    </Modal>
  )
}
