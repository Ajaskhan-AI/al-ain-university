import type { ReactNode } from 'react'

interface Props {
  label: string
  /** id of the input inside, so clicking the label focuses it. */
  htmlFor?: string
  hint?: string
  required?: boolean
  /** Adds "(optional)" after the label. */
  optional?: boolean
  error?: string
  children: ReactNode
}

/** Label + input + hint/error, laid out consistently in every form. */
export function Field({ label, htmlFor, hint, required, optional, error, children }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-navy-800">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
        {optional && <span className="ml-1 font-normal text-navy-400">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-navy-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  )
}
