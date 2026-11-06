import clsx from 'clsx'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Tone } from './Badge'
import { ToastContext } from './toastContext'

interface Toast {
  id: number
  message: string
  tone: Tone
}

const TONE_STYLE: Record<Tone, string> = {
  ok: 'border-green-200 text-green-900',
  warn: 'border-amber-200 text-amber-900',
  alert: 'border-red-200 text-red-900',
  info: 'border-sky-200 text-sky-900',
  neutral: 'border-navy-200 text-navy-900',
}

/** Toast notifications (bottom-right). Used for confirmations and, in step 7, live alerts. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (message: string, tone: Tone = 'ok') => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 sm:bottom-4">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'alert' || toast.tone === 'warn' ? TriangleAlert : toast.tone === 'ok' ? CircleCheck : Info
          return (
            <div
              key={toast.id}
              role="status"
              className={clsx('pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 shadow-lg', TONE_STYLE[toast.tone])}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="text-navy-400 hover:text-navy-700">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
