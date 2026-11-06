import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { SMDB_STATUS_LABELS, SMDB_STATUS_TONE } from '../../lib/smdb'
import type { SmdbStatus } from '../../types'
import { Badge } from '../ui/Badge'

export function SmdbStatusBadge({ status }: { status: SmdbStatus }) {
  return <Badge tone={SMDB_STATUS_TONE[status]}>{SMDB_STATUS_LABELS[status]}</Badge>
}

/** Pulsing "Live" dot + seconds since the last update. */
export function LiveIndicator({ updatedAt, intervalMs }: { updatedAt: number; intervalMs: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const seconds = Math.max(0, Math.round((now - updatedAt) / 1000))
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-800 ring-1 ring-green-600/20">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-green-600" />
      </span>
      Live · updated {seconds}s ago · every {intervalMs / 1000}s
    </span>
  )
}

/** Thin horizontal load bar coloured by thresholds. */
export function LoadBar({ pct, warn, crit }: { pct: number; warn: number; crit: number }) {
  const color = pct > crit ? 'bg-red-500' : pct > warn ? 'bg-amber-500' : 'bg-teal-500'
  return (
    <div className="relative h-2 w-full rounded-full bg-navy-50">
      <div className={clsx('h-2 rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(100, pct)}%` }} />
      <span className="absolute top-[-2px] h-3 w-px bg-amber-500" style={{ left: `${warn}%` }} aria-hidden />
      <span className="absolute top-[-2px] h-3 w-px bg-red-500" style={{ left: `${crit}%` }} aria-hidden />
    </div>
  )
}
