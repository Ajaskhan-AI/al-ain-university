import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { BUILDINGS } from '../../data/buildings'
import { actorFromUser } from '../../lib/actor'
import { filterByCampus } from '../../lib/campus'
import { PRIORITY_LABELS, defaultPriority } from '../../lib/tickets'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { TicketCategory, TicketPriority } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { inputClass } from '../ui/styles'
import { CategoryPicker } from './CategoryPicker'

/** Helpdesk / FM staff logging a complaint received by phone, email or walk-in. */
export function NewTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { rooms, campus, counters } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()

  const [roomId, setRoomId] = useState('')
  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [description, setDescription] = useState('')
  const [requesterName, setRequesterName] = useState('')
  const [requesterPhone, setRequesterPhone] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const room = rooms.find((r) => r.id === roomId)
  const buildings = filterByCampus(BUILDINGS, campus)

  const pickCategory = (value: TicketCategory) => {
    setCategory(value)
    setPriority(defaultPriority(value, room))
  }

  const valid = !!room && !!category && description.trim().length >= 5

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (!valid || !room || !category || !user) return
    const id = `WO-${counters.ticket}`
    dispatch(
      actions.createTicket({
        id,
        roomId: room.id,
        buildingId: room.buildingId,
        campus: room.campus,
        category,
        description,
        priority,
        source: 'helpdesk',
        requesterName,
        requesterPhone,
        by: actorFromUser(user),
      }),
    )
    onCreated(id)
  }

  return (
    <Modal
      title="New complaint"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-ticket-form" variant="teal">
            Create ticket
          </Button>
        </>
      }
    >
      <form id="new-ticket-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Room" htmlFor="nt-room" required error={showErrors && !room ? 'Choose a room.' : undefined}>
          <select id="nt-room" value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputClass}>
            <option value="">Select a room…</option>
            {buildings.map((b) => (
              <optgroup key={b.id} label={b.name}>
                {rooms
                  .filter((r) => r.buildingId === b.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Problem type" required error={showErrors && !category ? 'Choose a problem type.' : undefined}>
          <CategoryPicker value={category} onChange={pickCategory} />
        </Field>

        <Field
          label="Description"
          htmlFor="nt-desc"
          required
          error={showErrors && description.trim().length < 5 ? 'At least 5 characters.' : undefined}
        >
          <textarea id="nt-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Priority" htmlFor="nt-priority">
            <select
              id="nt-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className={inputClass}
            >
              {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reported by" htmlFor="nt-name" optional>
            <input id="nt-name" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor="nt-phone" optional>
            <input id="nt-phone" value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
