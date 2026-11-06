import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <Icon className="mx-auto size-8 text-navy-300" aria-hidden />
      <p className="mt-2 font-semibold text-navy-700">{title}</p>
      {children && <div className="mt-1 text-sm text-navy-500">{children}</div>}
    </div>
  )
}
