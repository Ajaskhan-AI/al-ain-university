import clsx from 'clsx'
import { ArrowLeft, ArrowRight, CircleCheckBig, MapPin, Search, Send, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PublicShell } from '../../components/layout/PublicShell'
import { CategoryPicker } from '../../components/tickets/CategoryPicker'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { PhotoInput } from '../../components/ui/PhotoInput'
import { buttonClass, inputClass } from '../../components/ui/styles'
import { getBuilding } from '../../data/buildings'
import { requesterActor } from '../../lib/actor'
import { slaTargetLabel } from '../../lib/sla'
import { CATEGORY_LABELS, defaultPriority } from '../../lib/tickets'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { TicketCategory } from '../../types'

/** One-tap phrases per category, so a student can describe the problem quickly on a phone. */
const SUGGESTIONS: Partial<Record<TicketCategory, string[]>> = {
  ac: ['AC not cooling', 'Water dripping from AC', 'AC is noisy', 'Too cold'],
  lighting: ['Lights not working', 'Light flickering', 'Lights always on'],
  plumbing: ['Tap leaking', 'Toilet not flushing', 'Sink blocked', 'Water on the floor'],
  cleaning: ['Bins overflowing', 'Spill on the floor', 'Washroom needs cleaning'],
  other: ['Door lock broken', 'Broken chair/desk', 'Socket not working'],
}

const STEPS = ['What’s wrong?', 'Tell us more', 'Send']

/**
 * Public complaint form opened from a room's QR code (no login), e.g.
 * /#/report/AIN-B2-105. Three short steps designed for a phone.
 */
export default function ReportProblemPage() {
  const { roomId = '' } = useParams()
  const { rooms, counters } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const room = rooms.find((r) => r.id === roomId.toUpperCase())
  const building = room ? getBuilding(room.buildingId) : undefined

  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [safety, setSafety] = useState(false)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  if (!room) {
    return (
      <PublicShell title="Report a problem">
        <UnknownRoom roomId={roomId} onPick={(id) => navigate(`/report/${id}`)} />
      </PublicShell>
    )
  }

  const priority = safety ? 'high' : category ? defaultPriority(category, room) : 'medium'

  const next = () => {
    if (step === 0 && !category) return setError('Choose the type of problem.')
    if (step === 1 && description.trim().length < 5) return setError('Please describe the problem (at least 5 characters).')
    setError(null)
    setStep((s) => s + 1)
    window.scrollTo({ top: 0 })
  }

  const submit = () => {
    if (!category) return
    const id = `WO-${counters.ticket}`
    dispatch(
      actions.createTicket({
        id,
        roomId: room.id,
        buildingId: room.buildingId,
        campus: room.campus,
        category,
        description: safety ? `[Safety] ${description}` : description,
        priority,
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

  const restart = () => {
    setStep(0)
    setCategory(null)
    setSafety(false)
    setDescription('')
    setPhoto(null)
    setSubmittedId(null)
    setError(null)
  }

  if (submittedId) {
    return (
      <PublicShell title="Report a problem">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <CircleCheckBig className="mx-auto size-14 text-ok" aria-hidden />
          <h2 className="mt-3 text-xl font-bold text-navy-900">Thank you — request received</h2>
          <p className="mt-2 text-navy-600">Your ticket number</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-navy-900">{submittedId}</p>
          <p className="mt-2 text-sm text-navy-500">Keep it to check progress at any time.</p>
        </div>
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">What happens next</h3>
          <ol className="mt-3 space-y-3 text-sm">
            {[
              ['The FM team has your request for ' + room.name, true],
              ['A technician is assigned — target: ' + slaTargetLabel(priority).split(' · ')[0].toLowerCase(), false],
              ['The problem is fixed and the ticket is closed', false],
            ].map(([text, done], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={clsx('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-teal-600 text-white' : 'bg-navy-100 text-navy-500')}>
                  {i + 1}
                </span>
                <span className="pt-0.5 text-navy-700">{text as string}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-4 grid gap-2">
          <Link to={`/track/${submittedId}`} className={buttonClass('teal', 'lg', 'w-full')}>
            <Search className="size-5" aria-hidden />
            Track this request
          </Link>
          <Button variant="secondary" size="lg" className="w-full" onClick={restart}>
            Report another problem
          </Button>
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell title="Report a problem">
      {/* Room from the QR code */}
      <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
        <MapPin className="mt-0.5 size-5 text-teal-700" aria-hidden />
        <div>
          <p className="font-semibold text-navy-900">{room.name}</p>
          <p className="text-sm text-navy-600">
            {building?.name} · {room.floor} floor · {room.id}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className={clsx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-teal-500' : 'bg-navy-200')} />
          ))}
        </div>
        <p className="mt-2 text-sm text-navy-500">
          Step {step + 1} of {STEPS.length} · <span className="font-semibold text-navy-800">{STEPS[step]}</span>
        </p>
      </div>

      <div className="mt-4 space-y-5">
        {step === 0 && (
          <>
            <CategoryPicker
              value={category}
              onChange={(c) => {
                setCategory(c)
                setError(null)
              }}
            />
            <label className={clsx('flex cursor-pointer items-start gap-3 rounded-xl border p-4', safety ? 'border-red-300 bg-red-50' : 'border-navy-100 bg-white')}>
              <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} className="mt-0.5 size-5 accent-red-600" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold text-navy-900">
                  <ShieldAlert className="size-4 text-red-600" aria-hidden />
                  This is a safety issue
                </span>
                <span className="text-sm text-navy-600">Water leaking onto electrics, sparks, burning smell, broken glass… It will be treated as high priority.</span>
              </span>
            </label>
          </>
        )}

        {step === 1 && category && (
          <>
            <Field label={`Describe the problem (${CATEGORY_LABELS[category]})`} htmlFor="description" required>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. The AC is not cooling and the room is very warm"
                className={inputClass}
              />
            </Field>
            {SUGGESTIONS[category] && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS[category]!.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDescription((d) => (d.trim() ? `${d.trim()}. ${s}` : s))}
                    className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-sm text-navy-700 hover:border-teal-400 hover:bg-teal-50"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
            <Field label="Photo" optional>
              <PhotoInput value={photo} onChange={setPhoto} />
            </Field>
          </>
        )}

        {step === 2 && category && (
          <>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">Your request</p>
              <p className="mt-1 font-semibold text-navy-900">
                {CATEGORY_LABELS[category]}
                {safety && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Safety</span>}
              </p>
              <p className="mt-1 text-navy-700">{description}</p>
              {photo && <p className="mt-1 text-sm text-navy-500">Photo: {photo.name}</p>}
            </div>
            <p className="text-sm text-navy-600">Leave your details if you’d like the FM team to contact you (optional).</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" htmlFor="name" optional>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Phone" htmlFor="phone" optional>
                <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </>
        )}

        {error && <p className="text-sm font-medium text-red-700">{error}</p>}

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-5" aria-hidden />
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="teal" size="lg" className="flex-1" onClick={next}>
              Next
              <ArrowRight className="size-5" aria-hidden />
            </Button>
          ) : (
            <Button variant="teal" size="lg" className="flex-1" onClick={submit}>
              <Send className="size-5" aria-hidden />
              Submit request
            </Button>
          )}
        </div>
      </div>
    </PublicShell>
  )
}

function UnknownRoom({ roomId, onPick }: { roomId: string; onPick: (id: string) => void }) {
  const { rooms } = useAppState()
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy-900">Room “{roomId}” not found</h2>
      <p className="mt-1 text-sm text-navy-500">Choose your room from the list instead.</p>
      <select aria-label="Choose room" defaultValue="" onChange={(e) => e.target.value && onPick(e.target.value)} className={`${inputClass} mt-4`}>
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
