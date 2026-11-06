import { format, getDay } from 'date-fns'
import { useState } from 'react'
import { DailyEnergyChart, PeriodCompareChart, PeriodLegend, type DailyPoint } from '../../components/energy/EnergyCharts'
import { Card } from '../../components/ui/Card'
import { inputClass } from '../../components/ui/styles'
import { DAY_TYPE_LABELS } from '../../lib/calendar'
import { fromISODate } from '../../lib/dates'
import { PERIOD_COLORS } from '../../lib/energyAnalysis'
import { formatNumber } from '../../lib/format'
import { useAppState } from '../../store/hooks'
import type { AcademicPeriod, DayType, EnergyRecord } from '../../types'
import type { EnergyScope } from './scope'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function OverviewTab({ scope, history }: { scope: EnergyScope; history: EnergyRecord[] }) {
  const { calendar } = useAppState()
  const { records, analysis } = scope

  // ---- Daily totals for the chart ----
  const byDate = new Map<string, DailyPoint>()
  const flaggedDates = new Set(scope.flagsInScope.map((f) => f.date))
  for (const r of records) {
    const p = byDate.get(r.date) ?? {
      t: fromISODate(r.date).getTime(),
      date: r.date,
      kWh: 0,
      expected: 0,
      flagged: flaggedDates.has(r.date),
      dayType: analysis.dayTypes.get(r.date) ?? 'unscheduled',
    }
    p.kWh += r.kWh
    p.expected += Math.round(analysis.expected.get(`${r.buildingId}:${r.date}`) ?? 0)
    byDate.set(r.date, p)
  }
  const points = [...byDate.values()].sort((a, b) => a.t - b.t)

  // ---- Average per day by period type ----
  const agg = new Map<DayType, { days: number; kWh: number }>()
  for (const p of points) {
    const a = agg.get(p.dayType) ?? { days: 0, kWh: 0 }
    agg.set(p.dayType, { days: a.days + 1, kWh: a.kWh + p.kWh })
  }
  const byType = [...agg.entries()].map(([type, a]) => ({ type, days: a.days, avg: a.kWh / a.days })).sort((a, b) => b.avg - a.avg)
  const teachingAvg = byType.find((t) => t.type === 'teaching')?.avg
  const maxAvg = Math.max(1, ...byType.map((t) => t.avg))

  return (
    <div className="space-y-6">
      <Card
        title="Daily electricity vs academic calendar"
        subtitle="Coloured bands = academic periods · dashed line = expected use for that day type · red dots = flagged waste"
      >
        <DailyEnergyChart points={points} periods={calendar} />
        <div className="mt-3">
          <PeriodLegend />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Average per day by period type" subtitle="Selected buildings and date range">
          <ul className="space-y-3">
            {byType.map((t) => (
              <li key={t.type} className="grid grid-cols-[8.5rem_1fr_6.5rem] items-center gap-3 text-sm">
                <span className="flex items-center gap-2 text-navy-800">
                  <span className="size-3 rounded-sm" style={{ background: PERIOD_COLORS[t.type] === '#f1f5f9' ? '#94a3b8' : PERIOD_COLORS[t.type] }} />
                  {DAY_TYPE_LABELS[t.type]} <span className="text-xs text-navy-400">({t.days}d)</span>
                </span>
                <span className="h-2.5 rounded-full bg-navy-50">
                  <span className="block h-2.5 rounded-full bg-navy-500" style={{ width: `${(t.avg / maxAvg) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums">
                  {formatNumber(t.avg)} kWh
                  {teachingAvg && t.type !== 'teaching' && <span className="block text-xs text-navy-500">{Math.round((t.avg / teachingAvg) * 100)}% of teaching</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <ComparePeriods scope={scope} calendar={calendar} history={history} />
      </div>
    </div>
  )
}

/** Pick two academic periods and compare their average weekday profile (uses all meter data). */
function ComparePeriods({ scope, calendar, history }: { scope: EnergyScope; calendar: AcademicPeriod[]; history: EnergyRecord[] }) {
  const ids = new Set(scope.buildings.map((b) => b.id))
  const dates = history.map((r) => r.date)
  const first = dates.reduce((m, d) => (d < m ? d : m), dates[0] ?? '')
  const last = dates.reduce((m, d) => (d > m ? d : m), dates[0] ?? '')
  const options = calendar.filter((p) => p.end >= first && p.start <= last)
  const latest = (type: string) => [...options].reverse().find((p) => p.type === type)?.id
  const [aId, setAId] = useState(() => latest('teaching') ?? options[0]?.id ?? '')
  const [bId, setBId] = useState(() => latest('summer') ?? options[1]?.id ?? '')
  const a = options.find((p) => p.id === aId)
  const b = options.find((p) => p.id === bId)

  /** Average kWh per day, overall and per weekday (Mon = 0), for the selected buildings. */
  const profile = (period?: AcademicPeriod) => {
    const perDay = new Map<string, number>()
    if (period) {
      for (const r of history) {
        if (ids.has(r.buildingId) && r.date >= period.start && r.date <= period.end) perDay.set(r.date, (perDay.get(r.date) ?? 0) + r.kWh)
      }
    }
    const sums = Array.from({ length: 7 }, () => ({ kWh: 0, days: 0 }))
    let total = 0
    for (const [date, kWh] of perDay) {
      const wd = (getDay(fromISODate(date)) + 6) % 7
      sums[wd].kWh += kWh
      sums[wd].days++
      total += kWh
    }
    return { perWeekday: sums.map((x) => (x.days ? x.kWh / x.days : 0)), avg: perDay.size ? total / perDay.size : 0 }
  }
  const pa = profile(a)
  const pb = profile(b)
  const data = WEEKDAYS.map((day, i) => ({ day, a: Math.round(pa.perWeekday[i]), b: Math.round(pb.perWeekday[i]) }))
  const diff = pa.avg ? Math.round(((pb.avg - pa.avg) / pa.avg) * 100) : 0

  return (
    <Card title="Compare periods" subtitle="Average electricity per weekday — e.g. a teaching period vs summer break">
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        {[
          [aId, setAId, 'Period A'] as const,
          [bId, setBId, 'Period B'] as const,
        ].map(([value, set, name]) => (
          <label key={name} className="block">
            <span className="mb-1 block text-xs font-medium text-navy-600">{name}</span>
            <select value={value} onChange={(e) => set(e.target.value)} className={inputClass}>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({format(fromISODate(p.start), 'd MMM')} – {format(fromISODate(p.end), 'd MMM yy')})
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <PeriodCompareChart data={data} labelA={a?.name ?? '—'} labelB={b?.name ?? '—'} />
      <p className="mt-2 text-sm text-navy-700">
        Average per day: <strong>{formatNumber(pa.avg)} kWh</strong> vs <strong>{formatNumber(pb.avg)} kWh</strong>
        {pa.avg > 0 && <> ({diff > 0 ? '+' : ''}{diff}%)</>}. Uses all available meter data (ignores the date-range filter).
      </p>
    </Card>
  )
}
