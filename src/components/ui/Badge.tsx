import clsx from 'clsx'
import type { ReactNode } from 'react'

/** ok = green, warn = amber, alert = red (CLAUDE.md status colours). info/neutral for everything else. */
export type Tone = 'ok' | 'warn' | 'alert' | 'info' | 'neutral'

const TONES: Record<Tone, string> = {
  ok: 'bg-ok-soft text-green-800 ring-green-600/20',
  warn: 'bg-warn-soft text-amber-800 ring-amber-600/20',
  alert: 'bg-alert-soft text-red-800 ring-red-600/20',
  info: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  neutral: 'bg-navy-50 text-navy-700 ring-navy-500/15',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
