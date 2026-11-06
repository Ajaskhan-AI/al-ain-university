import clsx from 'clsx'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toISODate } from '../../lib/dates'
import { getPpmStatus } from '../../lib/ppm'
import type { Asset, PpmStatus, PpmTask } from '../../types'
import { Button } from '../ui/Button'

const DOT: Record<PpmStatus, string> = {
  done: 'bg-green-500',
  due: 'bg-amber-500',
  overdue: 'bg-red-500',
}
const CHIP: Record<PpmStatus, string> = {
  done: 'bg-green-50 text-green-800',
  due: 'bg-amber-50 text-amber-800',
  overdue: 'bg-red-50 text-red-800 font-semibold',
}

interface Props {
  month: Date
  onMonthChange: (month: Date) => void
  tasks: PpmTask[]
  assets: Asset[]
  today: string
  selectedDay: string | null
  onSelectDay: (day: string | null) => void
}

/** Month grid (Mon–Sun) with each day's PPM tasks coloured done / due / overdue. */
export function PpmCalendar({ month, onMonthChange, tasks, assets, today, selectedDay, onSelectDay }: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })
  const byDay = new Map<string, PpmTask[]>()
  for (const task of tasks) byDay.set(task.dueDate, [...(byDay.get(task.dueDate) ?? []), task])
  const assetName = (id: string) => assets.find((a) => a.id === id)?.name ?? id

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Previous month">
            <ChevronLeft className="size-5" />
          </Button>
          <h3 className="w-40 text-center text-lg font-semibold text-navy-900">{format(month, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight className="size-5" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(startOfMonth(new Date()))}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-navy-600">
          {(['done', 'due', 'overdue'] as PpmStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 capitalize">
              <span className={clsx('size-2.5 rounded-full', DOT[s])} />
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-navy-100 bg-navy-100 text-sm">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="bg-navy-50 px-2 py-1.5 text-center text-xs font-semibold text-navy-500">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const iso = toISODate(day)
          const dayTasks = byDay.get(iso) ?? []
          const inMonth = isSameMonth(day, month)
          const isSelected = selectedDay === iso
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(isSelected ? null : iso)}
              aria-label={`${format(day, 'd MMMM')}: ${dayTasks.length} tasks`}
              aria-pressed={isSelected}
              className={clsx(
                'flex min-h-16 flex-col items-stretch gap-1 p-1.5 text-left transition sm:min-h-24',
                inMonth ? 'bg-white hover:bg-teal-50/50' : 'bg-navy-50/60 text-navy-300',
                isSelected && 'ring-2 ring-teal-500 ring-inset',
              )}
            >
              <span
                className={clsx(
                  'inline-flex size-6 items-center justify-center self-start rounded-full text-xs font-semibold',
                  iso === today ? 'bg-navy-800 text-white' : inMonth ? 'text-navy-700' : '',
                )}
              >
                {format(day, 'd')}
              </span>
              {/* Phones: coloured dots. Larger screens: named chips. */}
              <span className="flex flex-wrap gap-0.5 sm:hidden">
                {dayTasks.map((t) => (
                  <span key={t.id} className={clsx('size-2 rounded-full', DOT[getPpmStatus(t, today)])} />
                ))}
              </span>
              <span className="hidden space-y-0.5 sm:block">
                {dayTasks.slice(0, 3).map((t) => (
                  <span key={t.id} className={clsx('block truncate rounded px-1.5 py-0.5 text-[11px]', CHIP[getPpmStatus(t, today)])}>
                    {assetName(t.assetId)}
                  </span>
                ))}
                {dayTasks.length > 3 && <span className="block px-1.5 text-[11px] text-navy-500">+{dayTasks.length - 3} more</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
