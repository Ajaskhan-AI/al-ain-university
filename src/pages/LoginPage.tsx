import { ArrowRight, MapPin, QrCode } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { ROLE_HOME, ROLE_LABELS, ROLE_ORDER } from '../auth/roles'
import { SampleBadge } from '../components/layout/SampleBadge'
import { UserAvatar } from '../components/ui/UserAvatar'
import { CAMPUS_FILTER_LABELS } from '../data/campuses'
import { actions } from '../store/actions'
import { useAppDispatch, useAppState } from '../store/hooks'

/** Demo login: one card per demo user, click to sign in. No passwords. */
export default function LoginPage() {
  const { users } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const sorted = [...users].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))

  const signIn = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    dispatch(actions.login(user.id))
    navigate(ROLE_HOME[user.role])
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-white">
              Kuroshio <span className="text-teal-300">AI</span>
              <span className="ml-2 text-base font-medium text-navy-300">FacilityIQ</span>
            </p>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Al Ain University — Facilities Management
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-navy-200">
              Choose a demo user to see the platform from their role. No passwords — click a card to sign in.
            </p>
          </div>
          <SampleBadge />
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => signIn(user.id)}
              className="group flex items-start gap-4 rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-navy-800 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-teal-400 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              <UserAvatar user={user} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-navy-900">{user.name}</span>
                <span className="block text-sm text-navy-500">{user.jobTitle}</span>
                <span className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-700">
                    {ROLE_LABELS[user.role]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-navy-500">
                    <MapPin className="size-3.5" aria-hidden />
                    {CAMPUS_FILTER_LABELS[user.campus]}
                  </span>
                </span>
              </span>
              <ArrowRight className="mt-1 size-5 text-navy-300 transition group-hover:text-teal-600" aria-hidden />
            </button>
          ))}

          {/* Requester: no login, uses the public complaint form from a room QR code */}
          <Link
            to="/report/AIN-B2-105"
            className="group flex items-start gap-4 rounded-xl border-2 border-dashed border-navy-600 p-5 text-left transition hover:border-teal-400"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-navy-800 text-teal-300">
              <QrCode className="size-7" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold text-white">Staff / student</span>
              <span className="block text-sm text-navy-300">
                No login — report a problem by scanning a room QR code (example: room AIN-B2-105)
              </span>
            </span>
            <ArrowRight className="mt-1 size-5 text-navy-400 transition group-hover:text-teal-300" aria-hidden />
          </Link>
        </div>

        <p className="mt-10 text-sm text-navy-400">
          All names are fictional demo users. All figures in this demo are sample data.
        </p>
      </div>
    </div>
  )
}
