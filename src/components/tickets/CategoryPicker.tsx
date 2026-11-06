import clsx from 'clsx'
import { CATEGORY_LABELS, PUBLIC_CATEGORIES } from '../../lib/tickets'
import type { TicketCategory } from '../../types'
import { CATEGORY_ICONS } from './categoryIcons'

/** Big tap-friendly category buttons (works well on a phone). */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: TicketCategory | null
  onChange: (category: TicketCategory) => void
}) {
  return (
    <div role="radiogroup" aria-label="Problem type" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {PUBLIC_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category]
        const selected = value === category
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category)}
            className={clsx(
              'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-sm font-medium transition',
              selected
                ? 'border-teal-500 bg-teal-50 text-teal-800'
                : 'border-navy-100 bg-white text-navy-700 hover:border-navy-300',
            )}
          >
            <Icon className="size-6" aria-hidden />
            {CATEGORY_LABELS[category]}
          </button>
        )
      })}
    </div>
  )
}
