import { CircleCheck, HeartPulse, Siren, TriangleAlert } from 'lucide-react'
import { useNavigate, Link } from 'react-router'
import { HealthBadge, HealthBar, HealthSparkline } from '../../components/predictive/PredictiveCharts'
import { ASSET_ICONS } from '../../components/ppm/assetIcons'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { getBuilding } from '../../data/buildings'
import { matchesCampus } from '../../lib/campus'
import { usePredictive } from '../../sim/usePredictive'
import { useAppState } from '../../store/hooks'

/** Module 2 home: health of every CT-monitored chiller, AHU and pump, worst first. */
export default function PredictivePage() {
  const { assets, campus } = useAppState()
  const navigate = useNavigate()
  const assessments = usePredictive()

  const rows = assessments
    .map((a) => ({ a, asset: assets.find((x) => x.id === a.assetId) }))
    .filter((r): r is { a: (typeof assessments)[number]; asset: NonNullable<typeof r.asset> } => !!r.asset && matchesCampus(campus, r.asset.campus))
    .sort((x, y) => x.a.health - y.a.health)
  const count = (s: string) => rows.filter((r) => r.a.status === s).length

  return (
    <>
      <PageHeader
        title="Predictive Maintenance"
        description="CT clamps on critical motors track running current. Changes in the current signature reveal developing faults weeks before a breakdown."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Monitored assets" value={rows.length} sub="Chillers, AHUs and pumps" icon={HeartPulse} tone="info" />
        <KpiCard label="OK" value={count('ok')} sub="Health 80–100" icon={CircleCheck} tone="ok" />
        <KpiCard label="Watch" value={count('watch')} sub="Health 60–79 — plan maintenance" icon={TriangleAlert} tone={count('watch') ? 'warn' : 'ok'} />
        <KpiCard label="Alert" value={count('alert')} sub="Health below 60 — act now" icon={Siren} tone={count('alert') ? 'alert' : 'ok'} />
      </div>

      <Card className="mt-6" flush title="Asset health" subtitle="Sorted by health score — lowest first. Click a row for the diagnosis.">
        {rows.length === 0 ? (
          <EmptyState icon={HeartPulse} title="No monitored assets on this campus" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="w-44 px-3 py-3">Health</th>
                  <th className="px-3 py-3">Last 60 days</th>
                  <th className="px-3 py-3">Detected issue</th>
                  <th className="px-3 py-3">Current vs normal</th>
                  <th className="px-5 py-3">Time to action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map(({ a, asset }) => {
                  const Icon = ASSET_ICONS[asset.category]
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => navigate(`/predictive/${asset.id}`)}
                      className={a.status === 'alert' ? 'cursor-pointer bg-red-50/60 hover:bg-red-50' : 'cursor-pointer hover:bg-teal-50/40'}
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <span>
                            <Link to={`/predictive/${asset.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-navy-900 hover:text-teal-700">
                              {asset.name}
                            </Link>
                            <span className="block text-xs text-navy-400">
                              <span className="font-mono">{asset.id}</span> · {getBuilding(asset.buildingId)?.shortName}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <HealthBadge status={a.status} />
                      </td>
                      <td className="px-3 py-3">
                        <HealthBar score={a.health} />
                      </td>
                      <td className="px-3 py-3">
                        <HealthSparkline points={a.history} status={a.status} />
                      </td>
                      <td className="px-3 py-3 text-navy-700">{a.issue?.title ?? <span className="text-navy-400">Running normally</span>}</td>
                      <td className="px-3 py-3 tabular-nums">
                        <span className={Math.abs(a.deviationPct) > 8 ? 'font-semibold text-amber-700' : 'text-navy-700'}>
                          {a.currentA} A ({a.deviationPct > 0 ? '+' : ''}
                          {a.deviationPct}%)
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {a.daysToAction === null ? (
                          <span className="text-navy-400">—</span>
                        ) : (
                          <span className={a.status === 'alert' ? 'font-semibold text-red-700' : 'font-semibold text-amber-700'}>
                            ≈ {a.daysToAction} days
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
