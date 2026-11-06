import clsx from 'clsx'
import { format, subDays } from 'date-fns'
import { CalendarRange, ChartColumn, Coins, Flag, Grid3x3, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Card } from '../../components/ui/Card'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { inputClass } from '../../components/ui/styles'
import { BUILDINGS } from '../../data/buildings'
import { getEnergyHistory } from '../../data/energy'
import { DAY_TYPE_LABELS } from '../../lib/calendar'
import { filterByCampus } from '../../lib/campus'
import { kwhToTonnesCo2 } from '../../lib/co2'
import { fromISODate, toISODate } from '../../lib/dates'
import { LOW_OCCUPANCY, analyseEnergy } from '../../lib/energyAnalysis'
import { formatNumber } from '../../lib/format'
import { useAppState } from '../../store/hooks'
import type { DayType } from '../../types'
import { CalendarTab } from './CalendarTab'
import { HeatmapTab } from './HeatmapTab'
import { OverviewTab } from './OverviewTab'
import { WasteTab } from './WasteTab'
import type { EnergyScope } from './scope'

type Tab = 'overview' | 'waste' | 'heatmap' | 'calendar'
const TABS: Array<{ id: Tab; label: string; icon: typeof ChartColumn }> = [
  { id: 'overview', label: 'Energy vs calendar', icon: ChartColumn },
  { id: 'waste', label: 'Waste detection', icon: Flag },
  { id: 'heatmap', label: 'Hourly heatmap', icon: Grid3x3 },
  { id: 'calendar', label: 'Academic calendar', icon: CalendarRange },
]
const RANGES = [
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
  { id: 'custom', label: 'Custom range' },
] as const
const PERIOD_FILTERS: Array<DayType | 'all' | 'low'> = ['all', 'low', 'teaching', 'exams', 'ramadan', 'weekend', 'holiday', 'break', 'summer']

/** Module 5: energy use against the academic calendar, with automatic waste detection. */
export default function EnergyPage() {
  const { calendar, campus, reviewedWasteIds } = useAppState()
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.some((t) => t.id === params.get('tab')) ? (params.get('tab') as Tab) : 'overview'

  const now = useMemo(() => new Date(), [])
  const records = useMemo(() => getEnergyHistory(now), [now])
  // Recalculated whenever the academic calendar is edited.
  const analysis = useMemo(() => analyseEnergy(records, calendar), [records, calendar])
  const lastDay = toISODate(subDays(now, 1))
  const firstDay = toISODate(subDays(now, 365))

  const [buildingId, setBuildingId] = useState('all')
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('90')
  const [customFrom, setCustomFrom] = useState(toISODate(subDays(now, 60)))
  const [customTo, setCustomTo] = useState(lastDay)
  const [periodType, setPeriodType] = useState<DayType | 'all' | 'low'>('all')

  const campusBuildings = filterByCampus(BUILDINGS, campus)
  const activeBuilding = campusBuildings.some((b) => b.id === buildingId) ? buildingId : 'all'
  const buildings = activeBuilding === 'all' ? campusBuildings : campusBuildings.filter((b) => b.id === activeBuilding)
  const ids = new Set(buildings.map((b) => b.id))
  const from = range === 'custom' ? (customFrom < firstDay ? firstDay : customFrom) : toISODate(subDays(now, Number(range)))
  const to = range === 'custom' ? (customTo > lastDay ? lastDay : customTo) : lastDay

  const scopeRecords = records.filter((r) => ids.has(r.buildingId) && r.date >= from && r.date <= to)
  const flagsInScope = analysis.flags.filter((f) => ids.has(f.buildingId) && f.date >= from && f.date <= to)
  const matchesPeriod = (t: DayType) => periodType === 'all' || (periodType === 'low' ? LOW_OCCUPANCY.includes(t) : t === periodType)
  const scope: EnergyScope = {
    records: scopeRecords,
    flagsInScope,
    flags: flagsInScope.filter((f) => matchesPeriod(f.dayType)),
    buildings,
    from,
    to,
    analysis,
    matchesPeriod,
  }

  const totalKwh = scopeRecords.filter((r) => matchesPeriod(analysis.dayTypes.get(r.date) ?? 'unscheduled')).reduce((s, r) => s + r.kWh, 0)
  const days = new Set(scopeRecords.map((r) => r.date)).size
  const open = scope.flags.filter((f) => !reviewedWasteIds.includes(f.id))
  const excess = open.reduce((s, f) => s + f.excessKwh, 0)
  const aed = open.reduce((s, f) => s + f.aed, 0)

  return (
    <>
      <PageHeader
        title="Academic-Calendar Energy Analytics"
        description="Electricity use compared with the academic calendar — teaching, exams, weekends, Ramadan, holidays and summer — to find energy used when buildings are empty."
      />

      {/* Filters shared by every tab */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-600">Building</span>
            <select value={activeBuilding} onChange={(e) => setBuildingId(e.target.value)} className={inputClass}>
              <option value="all">All buildings ({campusBuildings.length})</option>
              {campusBuildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-600">Date range</span>
            <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className={inputClass}>
              {RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {range === 'custom' ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-navy-600">From</span>
                <input type="date" min={firstDay} max={lastDay} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-navy-600">To</span>
                <input type="date" min={firstDay} max={lastDay} value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={inputClass} />
              </label>
            </div>
          ) : (
            <p className="self-end pb-2 text-sm text-navy-500">
              {format(fromISODate(from), 'd MMM yyyy')} – {format(fromISODate(to), 'd MMM yyyy')}
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-600">Period type</span>
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value as typeof periodType)} className={inputClass}>
              {PERIOD_FILTERS.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? 'All period types' : p === 'low' ? 'Low occupancy (weekends, holidays, breaks)' : DAY_TYPE_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Electricity" value={`${formatNumber(totalKwh / 1000, 1)} MWh`} sub={`${days} days · ${buildings.length} building${buildings.length === 1 ? '' : 's'}`} icon={Zap} tone="info" />
        <KpiCard label="Average per day" value={`${formatNumber(days ? totalKwh / days : 0)} kWh`} sub={periodType === 'all' ? 'All days' : 'Selected period type'} icon={ChartColumn} tone="neutral" />
        <KpiCard label="Waste flags (open)" value={open.length} sub={`${scope.flags.length - open.length} reviewed`} icon={Flag} tone={open.length ? 'warn' : 'ok'} to="/energy?tab=waste" />
        <KpiCard
          label="Excess energy (open flags)"
          value={`${formatNumber(excess / 1000, 1)} MWh`}
          sub={`≈ ${formatNumber(aed)} AED · ${formatNumber(kwhToTonnesCo2(excess), 1)} t CO₂ (indicative)`}
          icon={Coins}
          tone={excess ? 'alert' : 'ok'}
        />
      </div>

      <div role="tablist" aria-label="Energy views" className="mt-6 flex flex-wrap gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams({ tab: id }, { replace: true })}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
              tab === id ? 'bg-navy-800 text-white' : 'bg-white text-navy-600 ring-1 ring-navy-100 hover:bg-navy-50',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'overview' && <OverviewTab scope={scope} history={records} />}
        {tab === 'waste' && <WasteTab scope={scope} />}
        {tab === 'heatmap' && <HeatmapTab scope={scope} records={records} />}
        {tab === 'calendar' && <CalendarTab flagCount={analysis.flags.length} />}
      </div>
    </>
  )
}
