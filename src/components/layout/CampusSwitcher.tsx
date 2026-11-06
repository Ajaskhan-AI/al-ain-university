import clsx from 'clsx'
import { MapPin } from 'lucide-react'
import { CAMPUS_FILTER_LABELS } from '../../data/campuses'
import type { CampusFilter } from '../../types'

const OPTIONS: CampusFilter[] = ['ALL', 'AIN', 'AUH']

interface Props {
  value: CampusFilter
  onChange: (value: CampusFilter) => void
  /** Single-campus users (step 3) see their campus but cannot change it. */
  locked?: boolean
}

export function CampusSwitcher({ value, onChange, locked = false }: Props) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-medium text-navy-800">
        <MapPin className="size-4" aria-hidden />
        {CAMPUS_FILTER_LABELS[value]}
      </span>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Campus"
      className="inline-flex rounded-lg border border-navy-200 bg-white p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === option
              ? 'bg-navy-800 text-white'
              : 'text-navy-600 hover:bg-navy-50',
          )}
        >
          {CAMPUS_FILTER_LABELS[option]}
        </button>
      ))}
    </div>
  )
}
