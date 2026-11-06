import { format, subDays } from 'date-fns'
import { Database } from 'lucide-react'
import { useMemo } from 'react'
import { BUILDINGS } from '../../data/buildings'
import { CAMPUS_FILTER_LABELS } from '../../data/campuses'
import { getEnergyHistory } from '../../data/energy'
import { SMDBS } from '../../data/smdbs'
import { filterByCampus } from '../../lib/campus'
import { toISODate } from '../../lib/dates'
import { getPpmStatus } from '../../lib/ppm'
import { savedSizeKb } from '../../store/persistence'
import { useAppState } from '../../store/hooks'

/**
 * TEMPORARY (step 2): proves the store, seed data, campus filter and
 * localStorage all work. Replaced by real Overview KPIs in step 10.
 */
export function DemoDataPanel() {
  const state = useAppState()
  const { campus } = state
  const now = useMemo(() => new Date(), [])
  const today = toISODate(now)

  const energy = useMemo(() => getEnergyHistory(now), [now])
  const energyInCampus = filterByCampus(energy, campus)
  const last30From = toISODate(subDays(now, 30))
  const kWh30 = energyInCampus.filter((r) => r.date >= last30From).reduce((sum, r) => sum + r.kWh, 0)

  const ppm = state.ppmTasks.filter((t) => {
    const asset = state.assets.find((a) => a.id === t.assetId)
    return asset && (campus === 'ALL' || asset.campus === campus)
  })
  const ppmBy = { done: 0, due: 0, overdue: 0 }
  for (const task of ppm) ppmBy[getPpmStatus(task, today)]++

  const tickets = filterByCampus(state.tickets, campus)
  const ticketsBy = { open: 0, assigned: 0, in_progress: 0, closed: 0 }
  for (const t of tickets) ticketsBy[t.status]++

  const rows: Array<[string, string]> = [
    ['Demo users', String(state.users.length)],
    ['Buildings', String(filterByCampus(BUILDINGS, campus).length)],
    ['Rooms (with QR)', String(filterByCampus(state.rooms, campus).length)],
    ['Technicians', String(filterByCampus(state.technicians, campus).length)],
    ['SMDBs', String(filterByCampus(SMDBS, campus).length)],
    [
      'Assets (monitored)',
      `${filterByCampus(state.assets, campus).length} (${filterByCampus(state.assets, campus).filter((a) => a.monitored).length})`,
    ],
    ['PPM tasks — done / due / overdue', `${ppm.length} — ${ppmBy.done} / ${ppmBy.due} / ${ppmBy.overdue}`],
    [
      'Tickets — open / assigned / in progress / closed',
      `${tickets.length} — ${ticketsBy.open} / ${ticketsBy.assigned} / ${ticketsBy.in_progress} / ${ticketsBy.closed}`,
    ],
    ['Alerts (historical)', String(filterByCampus(state.alerts, campus).length)],
    ['Academic calendar periods', String(state.calendar.length)],
    ['Energy records (daily, generated)', energyInCampus.length.toLocaleString()],
    ['kWh — last 30 days', kWh30.toLocaleString()],
    ['Seeded at', format(new Date(state.seededAt), 'd MMM yyyy, HH:mm')],
    ['Saved in localStorage', `${savedSizeKb()} KB`],
  ]

  return (
    <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-navy-700">
        <Database className="size-4" aria-hidden />
        Demo data check (temporary) — {CAMPUS_FILTER_LABELS[campus]}
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-navy-50 py-1.5">
            <dt className="text-navy-500">{label}</dt>
            <dd className="font-semibold tabular-nums text-navy-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
