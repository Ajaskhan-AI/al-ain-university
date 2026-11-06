import clsx from 'clsx'

/**
 * Shared class strings. Kept in a .ts file (not a component file) so both
 * <button> and <Link> can look like buttons.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'teal' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700',
  secondary: 'border border-navy-200 bg-white text-navy-700 hover:bg-navy-50',
  teal: 'bg-teal-600 text-white hover:bg-teal-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-navy-600 hover:bg-navy-100',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
    VARIANTS[variant],
    SIZES[size],
    extra,
  )
}

const fieldBase =
  'rounded-lg border border-navy-200 bg-white px-3 py-2 text-navy-900 placeholder:text-navy-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none'

/** Text inputs, selects and textareas (full width, as in forms). */
export const inputClass = `block w-full ${fieldBase}`

/** Selects that sit side by side in a toolbar (only as wide as their content). */
export const inlineSelectClass = `w-auto text-sm ${fieldBase}`
