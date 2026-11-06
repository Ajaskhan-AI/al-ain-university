import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** Usually the form's Cancel / Save buttons. */
  footer?: ReactNode
}

/** Simple centred dialog. Escape or clicking the backdrop closes it. */
export function Modal({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-navy-400 hover:bg-navy-50">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
