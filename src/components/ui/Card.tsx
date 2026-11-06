import clsx from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  title?: ReactNode
  /** Small text under the title. */
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
  /** Remove inner padding (e.g. for full-width tables). */
  flush?: boolean
  children: ReactNode
}

export function Card({ title, subtitle, actions, className, flush = false, children }: Props) {
  return (
    <section className={clsx('rounded-xl border border-navy-100 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-navy-50 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-navy-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-navy-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}
