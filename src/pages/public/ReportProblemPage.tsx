import { CircleCheckBig, MapPin, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { SampleBadge } from '../../components/layout/SampleBadge'
import { CategoryPicker } from '../../components/tickets/CategoryPicker'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { PhotoInput } from '../../components/ui/PhotoInput'
import { inputClass } from '../../components/ui/styles'
import { getBuilding } from '../../data/buildings'
import { requesterActor } from '../../lib/actor'
import { defaultPriority } from '../../lib/tickets'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { TicketCategory } from '../../types'

/**
 * Public complaint form opened from a room's QR code (no login), e.g.
 * /#/report/AIN-B2-105. Mobile layout: this is what a student/staff member sees.
 */
export default function ReportProblemPage() {
  const { roomId = '' } = useParams()
  const { rooms, counters } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const room = rooms.find((r) => r.id === roomId.toUpperCase())
  const building = room ? getBuilding(room.buildingId) : undefined

  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ category?: string; description?: string }>({})
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const resetForm = () => {
    setCategory(null)
    setDescription('')
    setPhoto(null)
    setErrors({})
    setSubmittedId(null)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!room) return
    const nextErrors = {
      ...(category ? {} : { category: 'Please choose the type of problem.' }),
      ...(description.trim().length >= 5 ? {} : { description: 'Please describe the problem (at least 5 characters).' }),
    }
    setErrors(nextErrors)
    if (!category || Object.keys(nextErrors).length > 0) return

    const id = `WO-${counters.ticket}`
    dispatch(
      actions.createTicket({
        id,
        roomId: room.id,
        buildingId: room.buildingId,
        campus: room.campus,
        category,
        description,
        priority: defaultPriority(category, room),
        source: 'qr',
        requesterName: name,
        requesterPhone: phone,
        photoName: photo?.name,
        by: requesterActor(name),
      }),
    )
    setSubmittedId(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen bg-navy-100">
      <div className="mx-auto min-h-screen max-w-lg bg-navy-50 shadow-xl">
        <header className="bg-navy-900 px-5 py-5 text-white">
          <p className="text-sm font-medium text-teal-300">Al Ain University · Facilities Management</p>
          <h1 className="mt-1 text-2xl font-bold">Report a problem</h1>
          <SampleBadge className="mt-3" />
        </header>

        <main className="px-5 py-6">
          {!room ? (
            <UnknownRoom roomId={roomId} onPick={(id) => navigate(`/report/${id}`)} />
          ) : submittedId ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <CircleCheckBig className="mx-auto size-14 text-ok" aria-hidden />
              <h2 className="mt-3 text-xl font-bold text-navy-900">Thank you — request received</h2>
              <p className="mt-2 text-navy-600">Your ticket number is</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-navy-900">{submittedId}</p>
              <p className="mt-3 text-sm text-navy-500">
                The FM team has been notified about <strong>{room.name}</strong>. Keep this number if you need to follow up.
              </p>
              <Button variant="secondary" size="lg" className="mt-6 w-full" onClick={resetForm}>
                Report another problem
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
                <MapPin className="mt-0.5 size-5 text-teal-700" aria-hidden />
                <div>
                  <p className="font-semibold text-navy-900">{room.name}</p>
                  <p className="text-sm text-navy-600">
                    {building?.name} · {room.floor} floor · Room ID {room.id}
                  </p>
                </div>
              </div>

              <Field label="What is the problem?" required error={errors.category}>
                <CategoryPicker value={category} onChange={setCategory} />
              </Field>

              <Field label="Describe the problem" htmlFor="description" required error={errors.description}>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. The AC is not cooling and the room is very warm"
                  className={inputClass}
                />
              </Field>

              <Field label="Photo" optional>
                <PhotoInput value={photo} onChange={setPhoto} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" htmlFor="name" optional>
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Phone" htmlFor="phone" optional>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Button type="submit" variant="teal" size="lg" className="w-full">
                <Send className="size-5" aria-hidden />
                Submit
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-navy-400">
            Kuroshio AI · FacilityIQ demo ·{' '}
            <Link to="/login" className="underline hover:text-navy-600">
              back to demo login
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}

function UnknownRoom({ roomId, onPick }: { roomId: string; onPick: (id: string) => void }) {
  const { rooms } = useAppState()
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy-900">Room “{roomId}” not found</h2>
      <p className="mt-1 text-sm text-navy-500">Choose your room from the list instead.</p>
      <select
        aria-label="Choose room"
        defaultValue=""
        onChange={(e) => e.target.value && onPick(e.target.value)}
        className={`${inputClass} mt-4`}
      >
        <option value="" disabled>
          Select a room…
        </option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id} — {r.name}
          </option>
        ))}
      </select>
    </div>
  )
}
