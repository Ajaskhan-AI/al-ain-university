import clsx from 'clsx'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { fromISODate } from '../../lib/dates'
import { FREQUENCY_LABELS, PPM_STATUS_LABELS, PPM_STATUS_TONE, getPpmStatus } from '../../lib/ppm'
import { useAppState } from '../../store/hooks'
import type { PpmStatus, PpmTask } from '../../types'
import { Badge } from '../ui/Badge'
import { ASSET_ICONS } from './assetIcons'

export function PpmStatusBadge({ status }: { status: PpmStatus }) {
  return <Badge tone={PPM_STATUS_TONE[status]}>{PPM_STATUS_LABELS[status]}</Badge>
}

/** Compact task cards (calendar day, asset page, My Jobs). Overdue ones get a red edge. */
export function PpmTaskList({ tasks, today, showAsset = true }: { tasks: PpmTask[]; today: string; showAsset?: boolean }) {
  const { assets, technicians } = useAppState()
  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const asset = assets.find((a) => a.id === task.assetId)
        const status = getPpmStatus(task, today)
        const Icon = asset ? ASSET_ICONS[asset.category] : ChevronRight
        const tech = technicians.find((t) => t.id === task.assignedTechnicianId)
        return (
          <li key={task.id}>
            <Link
              to={`/ppm/tasks/${task.id}`}
              className={clsx(
                'flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition hover:border-teal-300',
                status === 'overdue' ? 'border-red-200 border-l-4 border-l-red-500 bg-red-50/40' : 'border-navy-100',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-navy-900">{task.title}</span>
                  <PpmStatusBadge status={status} />
                </span>
                <span className="block truncate text-xs text-navy-500">
                  {showAsset && asset && `${asset.id} · ${asset.name} · `}
                  {FREQUENCY_LABELS[task.frequency]} · due {format(fromISODate(task.dueDate), 'd MMM')}
                  {task.completion
                    ? ` · done by ${task.completion.technicianName}`
                    : tech
                      ? ` · ${tech.name}`
                      : ''}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-navy-300" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
