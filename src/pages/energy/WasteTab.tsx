import clsx from 'clsx'
import { format } from 'date-fns'
import { ClipboardList, Download, Flag } from 'lucide-react'
import { useState } from 'react'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/toastContext'
import { getBuilding } from '../../data/buildings'
import { DAY_TYPE_LABELS } from '../../lib/calendar'
import { downloadCsv, toCsv } from '../../lib/csv'
import { fromISODate } from '../../lib/dates'
import { FLAG_RATIO, TARIFF_NOTE, type WasteFlag } from '../../lib/energyAnalysis'
import { formatNumber } from '../../lib/format'
import { useAppState } from '../../store/hooks'
import { FlagDetailModal } from './FlagDetailModal'
import type { EnergyScope } from './scope'

const PAGE = 30

/** Flagged days: energy used when the building should be (nearly) empty. */
export function WasteTab({ scope }: { scope: EnergyScope }) {
  const { reviewedWasteIds, tickets } = useAppState()
  const user = useCurrentUser()
  const toast = useToast()
  const [showReviewed, setShowReviewed] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [selected, setSelected] = useState<WasteFlag | null>(null)

  const isReviewed = (f: WasteFlag) => reviewedWasteIds.includes(f.id)
  const list = scope.flags.filter((f) => showReviewed || !isReviewed(f))
  const workOrderFor = (f: WasteFlag) => tickets.find((t) => t.energyFlagId === f.id)

  // Summary per building: helps spot a recurring pattern (e.g. every weekend).
  const byBuilding = [...new Set(scope.flags.map((f) => f.buildingId))]
    .map((id) => {
      const flags = scope.flags.filter((f) => f.buildingId === id && !isReviewed(f))
      const types = [...new Set(flags.map((f) => DAY_TYPE_LABELS[f.dayType]))]
      return { id, count: flags.length, excess: flags.reduce((s, f) => s + f.excessKwh, 0), aed: flags.reduce((s, f) => s + f.aed, 0), types }
    })
    .filter((b) => b.count > 0)
    .sort((a, b) => b.excess - a.excess)

  const exportCsv = () => {
    const csv = toCsv(
      ['Date', 'Building', 'Campus', 'Period type', 'Actual kWh', 'Expected kWh', 'Excess kWh', 'Excess %', 'Indicative cost (AED)', 'Reviewed', 'Work order'],
      scope.flags.map((f) => [
        f.date,
        getBuilding(f.buildingId)?.name ?? f.buildingId,
        f.campus === 'AIN' ? 'Al Ain' : 'Abu Dhabi',
        DAY_TYPE_LABELS[f.dayType],
        f.actualKwh,
        f.expectedKwh,
        f.excessKwh,
        f.excessPct,
        f.aed,
        isReviewed(f) ? 'Yes' : 'No',
        workOrderFor(f)?.id ?? '',
      ]),
    )
    const fileName = `AAU-Energy-Waste-Flags-${scope.from}-to-${scope.to}.csv`
    downloadCsv(fileName, csv)
    toast.show(`Exported ${scope.flags.length} flags to ${fileName}`)
  }

  return (
    <div className="space-y-6">
      <Card
        title="Where energy doesn’t match occupancy"
        subtitle={`Days in low-occupancy periods (weekends, holidays, breaks, summer) using more than ${Math.round((FLAG_RATIO - 1) * 100)}% above the weather-adjusted expectation.`}
      >
        {byBuilding.length === 0 ? (
          <EmptyState icon={Flag} title="No open waste flags for these filters" />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {byBuilding.map((b) => (
              <li key={b.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="font-semibold text-navy-900">{getBuilding(b.id)?.name}</p>
                <p className="text-sm text-navy-600">
                  {b.count} flagged day{b.count === 1 ? '' : 's'} · mostly {b.types.join(', ').toLowerCase()}
                </p>
                <p className="mt-2 text-lg font-bold text-amber-800">
                  +{formatNumber(b.excess / 1000, 1)} MWh <span className="text-sm font-medium">≈ {formatNumber(b.aed)} AED</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-navy-500">{TARIFF_NOTE}</p>
      </Card>

      <Card
        flush
        title="Flagged days"
        subtitle="Click a row for the hourly profile and actions"
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" checked={showReviewed} onChange={(e) => setShowReviewed(e.target.checked)} className="size-4 accent-teal-600" />
              Show reviewed
            </label>
            {can(user, 'energy.edit') && (
              <Button size="sm" variant="secondary" onClick={exportCsv} disabled={!scope.flags.length}>
                <Download className="size-4" aria-hidden />
                Export CSV
              </Button>
            )}
          </>
        }
      >
        {list.length === 0 ? (
          <EmptyState icon={Flag} title="Nothing to show" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-3 py-3">Building</th>
                  <th className="px-3 py-3">Period</th>
                  <th className="px-3 py-3 text-right">Actual</th>
                  <th className="px-3 py-3 text-right">Expected</th>
                  <th className="px-3 py-3 text-right">Excess</th>
                  <th className="px-3 py-3 text-right">≈ AED</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {list.slice(0, limit).map((f) => {
                  const wo = workOrderFor(f)
                  const reviewed = isReviewed(f)
                  return (
                    <tr key={f.id} onClick={() => setSelected(f)} className={clsx('cursor-pointer hover:bg-teal-50/40', reviewed && 'text-navy-400')}>
                      <td className="px-5 py-3 whitespace-nowrap font-medium">{format(fromISODate(f.date), 'EEE d MMM yyyy')}</td>
                      <td className="px-3 py-3">{getBuilding(f.buildingId)?.name}</td>
                      <td className="px-3 py-3">
                        <Badge tone="warn">{DAY_TYPE_LABELS[f.dayType]}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(f.actualKwh)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(f.expectedKwh)}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-amber-800">
                        +{formatNumber(f.excessKwh)} <span className="text-xs font-normal">({f.excessPct}%)</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(f.aed)}</td>
                      <td className="px-5 py-3">
                        <span className="flex flex-wrap gap-1">
                          {reviewed ? <Badge tone="ok">Reviewed</Badge> : <Badge tone="alert">Open</Badge>}
                          {wo && (
                            <Badge tone="info">
                              <ClipboardList className="size-3" aria-hidden />
                              {wo.id}
                            </Badge>
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {list.length > limit && (
              <div className="border-t border-navy-50 px-5 py-3 text-center">
                <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>
                  Show more ({list.length - limit} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {selected && <FlagDetailModal flag={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
