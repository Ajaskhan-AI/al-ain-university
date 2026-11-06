import { addDays, format, startOfWeek, subWeeks } from 'date-fns'
import { useState } from 'react'
import { Heatmap, type HeatmapRow } from '../../components/energy/EnergyCharts'
import { Card } from '../../components/ui/Card'
import { inputClass } from '../../components/ui/styles'
import { getHourlyProfile } from '../../data/energy'
import { fromISODate, toISODate } from '../../lib/dates'
import type { EnergyRecord } from '../../types'
import type { EnergyScope } from './scope'

/** Hour × day heatmap for one building and one week. Night and weekend waste stands out. */
export function HeatmapTab({ scope, records }: { scope: EnergyScope; records: EnergyRecord[] }) {
  // Default building: the one with the most flags in scope, else the first.
  const flagCounts = new Map<string, number>()
  for (const f of scope.flagsInScope) flagCounts.set(f.buildingId, (flagCounts.get(f.buildingId) ?? 0) + 1)
  const defaultBuilding = [...flagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? scope.buildings[0]?.id ?? ''
  const [buildingChoice, setBuildingChoice] = useState<string | null>(null)
  const buildingId = buildingChoice && scope.buildings.some((b) => b.id === buildingChoice) ? buildingChoice : defaultBuilding

  // Weeks (Mon–Sun) in the selected range, newest first. Default: latest week with a flag for this building.
  const lastDay = fromISODate(scope.to)
  const weeks: string[] = []
  for (let w = startOfWeek(lastDay, { weekStartsOn: 1 }); toISODate(w) >= scope.from || weeks.length === 0; w = subWeeks(w, 1)) {
    weeks.push(toISODate(w))
    if (weeks.length >= 53) break
  }
  const latestFlag = scope.flagsInScope.filter((f) => f.buildingId === buildingId).map((f) => f.date).sort().pop()
  const defaultWeek = latestFlag ? toISODate(startOfWeek(fromISODate(latestFlag), { weekStartsOn: 1 })) : weeks[0]
  const [weekChoice, setWeekChoice] = useState<string | null>(null)
  const week = weekChoice && weeks.includes(weekChoice) ? weekChoice : defaultWeek

  const flagged = new Set(scope.flagsInScope.filter((f) => f.buildingId === buildingId).map((f) => f.date))
  const rows: HeatmapRow[] = Array.from({ length: 7 }, (_, i) => toISODate(addDays(fromISODate(week), i)))
    .map((date) => {
      const record = records.find((r) => r.buildingId === buildingId && r.date === date)
      return record
        ? { date, dayType: scope.analysis.dayTypes.get(date) ?? 'unscheduled', hours: getHourlyProfile(record), flagged: flagged.has(date) }
        : null
    })
    .filter((r): r is HeatmapRow => r !== null)

  return (
    <Card title="Hourly heatmap" subtitle="Each cell is one hour. Empty buildings should look pale at night and at weekends.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-navy-600">Building</span>
          <select value={buildingId} onChange={(e) => setBuildingChoice(e.target.value)} className={inputClass}>
            {scope.buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {flagCounts.get(b.id) ? ` — ${flagCounts.get(b.id)} flags` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-navy-600">Week starting</span>
          <select value={week} onChange={(e) => setWeekChoice(e.target.value)} className={inputClass}>
            {weeks.map((w) => (
              <option key={w} value={w}>
                {format(fromISODate(w), 'EEE d MMM yyyy')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length ? <Heatmap rows={rows} /> : <p className="text-sm text-navy-500">No meter data for this week.</p>}
    </Card>
  )
}
