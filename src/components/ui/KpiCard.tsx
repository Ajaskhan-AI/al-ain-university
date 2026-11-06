import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Tone } from './Badge'

const ICON_TONES: Record<Tone, string> = {
  ok: 'bg-ok-soft text-green-700',
  warn: 'bg-warn-soft text-amber-700',
  alert: 'bg-alert-soft text-red-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-navy-50 text-navy-700',
}

interface Props {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: LucideIcon
  tone?: Tone
  /** Makes the whole card a link (e.g. Overview KPI → its module). */
  to?: string
}

/** Big-number tile, readable on a projector. */
export function KpiCard({ label, value, sub, icon: Icon, tone = 'neutral', to }: Props) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        <span className={clsx('flex size-9 shrink-0 items-center justify-center rounded-lg', ICON_TONES[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-sm text-navy-500">{sub}</p>}
    </>
  )
  const className = 'block rounded-xl border border-navy-100 bg-white p-5 shadow-sm'
  return to ? (
    <Link to={to} className={clsx(className, 'transition hover:border-teal-300 hover:shadow-md')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
