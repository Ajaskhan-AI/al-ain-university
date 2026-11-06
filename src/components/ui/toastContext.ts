import { createContext, useContext } from 'react'
import type { Tone } from './Badge'

export interface ToastApi {
  /** Show a short message in the corner for a few seconds. */
  show: (message: string, tone?: Tone) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
