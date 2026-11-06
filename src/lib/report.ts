import { eachDayOfInterval, endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns'
import { BUILDINGS } from '../data/buildings'
import { CAMPUS_FILTER_LABELS } from '../data/campuses'
import { getEnergyHistory } from '../data/energy'
import type {
  AcademicPeriod,
  Alert,
  AssetCategory,
  CampusFilter,
  CampusId,
  DayType,
  PpmTask,
  Room,
  Technician,
  Ticket,
  TicketCategory,
  TicketStatus,
  Asset,
} from '../types'
import { DAY_TYPE_LABELS, resolveDayType } from './calendar'
import { matchesCampus } from './campus'
import { kwhToTonnesCo2 } from './co2'
import { fromISODate, toISODate } from './dates'
import { ASSET_CATEGORIES, ASSET_CATEGORY_LABELS, getPpmStatus, summarizePpm, type PpmSummary } from './ppm'
import { CATEGORIES, CATEGORY_LABELS, average, resolutionMs, responseMs } from './tickets'

/** Data the report needs from the store. */
export interface ReportSource {
  tickets: Ticket[]
  ppmTasks: PpmTask[]
  assets: Asset[]
  alerts: Alert[]
  calendar: AcademicPeriod[]
  rooms: Room[]
  technicians: Technician[]
}

export interface MonthlyReport {
  month: string // yyyy-MM
  monthLabel: string // "October 2026"
  campus: CampusFilter
  campusLabel: string
  /** Current month → figures are month-to-date. */
  isPartial: boolean
  periodLabel: string
  generatedAt: string
  ppm: {
    summary: PpmSummary
    byCategory: Array<{ category: AssetCategory; label: string } & PpmSummary>
    overdue: Array<{ id: string; title: string; assetId: string; assetName: string; dueDate: string; technician: string }>
  }
  tickets: {
    total: number
    byStatus: Record<TicketStatus, number>
    byCategory: Array<{ category: TicketCategory; label: string; count: number }>
    avgResponseMs: number | null
    avgResolutionMs: number | null
    repeatRooms: Array<{ roomId: string; roomName: string; count: number; categories: string }>
  }
  energy: {
    totalKwh: number
    days: number
    dataThrough: string | null
    byCampus: Array<{ campus: CampusId; label: string; kwh: number }>
    byBuilding: Array<{ id: string; name: string; campus: CampusId; kwh: number; sharePct: number }>
    byDayType: Array<{ dayType: DayType; label: string; days: number; avgKwhPerDay: number }>
  }
  co2: {
    tonnes: number
    byCampus: Array<{ label: string; tonnes: number }>
  }
  alerts: {
    total: number
    critical: number
    warning: number
    acknowledged: number
    workOrders: number
    bySource: Array<{ label: string; count: number }>
    monitoredAssets: number
    list: Array<{ date: string; title: string; building: string; severity: string; source: string }>
  }
}

/** Selectable months: current month and the 11 before it (energy history covers 365 days). */
export function reportMonths(now: Date): Array<{ value: string; label: string }> {
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(now), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') + (i === 0 ? ' (to date)' : '') }
  })
}

/** Previous full month, e.g. "2026-10" in November 2026. */
export function defaultReportMonth(now: Date): string {
  return format(subMonths(startOfMonth(now), 1), 'yyyy-MM')
}

/** e.g. AAU-FM-Report-2026-10-AlAin.pdf */
export function reportFileName(month: string, campus: CampusFilter): string {
  const campusPart = campus === 'AIN' ? 'AlAin' : campus === 'AUH' ? 'AbuDhabi' : 'BothCampuses'
  return `AAU-FM-Report-${month}-${campusPart}.pdf`
}

const SOURCE_LABELS: Record<Alert['source'], string> = { smdb: 'SMDB monitoring', predictive: 'Predictive maintenance', energy: 'Energy analytics' }

/**
 * All report numbers, calculated from the CURRENT store data — so tickets and
 * PPM completions made during the demo show up in the report and the PDF.
 */
export function buildMonthlyReport(source: ReportSource, month: string, campus: CampusFilter, now: Date): MonthlyReport {
  const start = startOfMonth(fromISODate(`${month}-01`))
  const end = endOfMonth(start)
  const today = toISODate(now)
  const from = toISODate(start)
  const to = toISODate(end)
  const isPartial = today <= to
  const periodEnd = isPartial ? today : to
  const inPeriod = (iso: string) => iso.slice(0, 10) >= from && iso.slice(0, 10) <= periodEnd
  const assetById = new Map(source.assets.map((a) => [a.id, a]))

  // ---------- PPM ----------
  const ppmTasks = source.ppmTasks.filter((t) => {
    const asset = assetById.get(t.assetId)
    return asset && matchesCampus(campus, asset.campus) && t.dueDate >= from && t.dueDate <= to
  })
  const byCategory = ASSET_CATEGORIES.map((category) => ({
    category,
    label: ASSET_CATEGORY_LABELS[category],
    ...summarizePpm(
      ppmTasks.filter((t) => assetById.get(t.assetId)?.category === category),
      today,
    ),
  })).filter((row) => row.done + row.due + row.overdue > 0)
  const overdue = ppmTasks
    .filter((t) => getPpmStatus(t, today) === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((t) => ({
      id: t.id,
      title: t.title,
      assetId: t.assetId,
      assetName: assetById.get(t.assetId)?.name ?? t.assetId,
      dueDate: t.dueDate,
      technician: source.technicians.find((x) => x.id === t.assignedTechnicianId)?.name ?? 'Unassigned',
    }))

  // ---------- Tickets ----------
  const tickets = source.tickets.filter((t) => matchesCampus(campus, t.campus) && inPeriod(t.createdAt))
  const byStatus: Record<TicketStatus, number> = { open: 0, assigned: 0, in_progress: 0, closed: 0 }
  for (const t of tickets) byStatus[t.status]++
  const perRoom = new Map<string, Ticket[]>()
  for (const t of tickets) if (t.roomId) perRoom.set(t.roomId, [...(perRoom.get(t.roomId) ?? []), t])
  const repeatRooms = [...perRoom.entries()]
    .filter(([, list]) => list.length >= 3)
    .map(([roomId, list]) => ({
      roomId,
      roomName: source.rooms.find((r) => r.id === roomId)?.name ?? roomId,
      count: list.length,
      categories: [...new Set(list.map((t) => CATEGORY_LABELS[t.category]))].join(', '),
    }))
    .sort((a, b) => b.count - a.count)

  // ---------- Energy (generated history, ends yesterday) ----------
  const energyEnd = toISODate(subDays(now, 1)) < periodEnd ? toISODate(subDays(now, 1)) : periodEnd
  const energy = getEnergyHistory(now).filter((r) => matchesCampus(campus, r.campus) && r.date >= from && r.date <= energyEnd)
  const totalKwh = energy.reduce((sum, r) => sum + r.kWh, 0)
  const campuses: CampusId[] = campus === 'ALL' ? ['AIN', 'AUH'] : [campus]
  const byCampus = campuses.map((c) => ({
    campus: c,
    label: CAMPUS_FILTER_LABELS[c],
    kwh: energy.filter((r) => r.campus === c).reduce((s, r) => s + r.kWh, 0),
  }))
  const byBuilding = BUILDINGS.filter((b) => matchesCampus(campus, b.campus))
    .map((b) => {
      const kwh = energy.filter((r) => r.buildingId === b.id).reduce((s, r) => s + r.kWh, 0)
      return { id: b.id, name: b.name, campus: b.campus, kwh, sharePct: totalKwh ? (kwh / totalKwh) * 100 : 0 }
    })
    .sort((a, b) => b.kwh - a.kwh)

  // Average daily consumption per academic period type (uses the editable calendar).
  const dayTotals = new Map<string, number>()
  for (const r of energy) dayTotals.set(r.date, (dayTotals.get(r.date) ?? 0) + r.kWh)
  const typeAgg = new Map<DayType, { days: number; kwh: number }>()
  const days = energyEnd >= from ? eachDayOfInterval({ start, end: fromISODate(energyEnd) }) : []
  for (const day of days) {
    const iso = toISODate(day)
    const type = resolveDayType(day, source.calendar)
    const agg = typeAgg.get(type) ?? { days: 0, kwh: 0 }
    typeAgg.set(type, { days: agg.days + 1, kwh: agg.kwh + (dayTotals.get(iso) ?? 0) })
  }
  const byDayType = [...typeAgg.entries()]
    .map(([dayType, agg]) => ({ dayType, label: DAY_TYPE_LABELS[dayType], days: agg.days, avgKwhPerDay: agg.kwh / agg.days }))
    .sort((a, b) => b.avgKwhPerDay - a.avgKwhPerDay)

  // ---------- Alerts ----------
  const alerts = source.alerts.filter((a) => matchesCampus(campus, a.campus) && inPeriod(a.createdAt))
  const bySource = (['smdb', 'predictive', 'energy'] as const)
    .map((s) => ({ label: SOURCE_LABELS[s], count: alerts.filter((a) => a.source === s).length }))
    .filter((s) => s.count > 0)

  return {
    month,
    monthLabel: format(start, 'MMMM yyyy'),
    campus,
    campusLabel: campus === 'ALL' ? 'Al Ain + Abu Dhabi campuses' : `${CAMPUS_FILTER_LABELS[campus]} Campus`,
    isPartial,
    periodLabel: isPartial
      ? `${format(start, 'd')}–${format(fromISODate(periodEnd), 'd MMM yyyy')} (month to date)`
      : `${format(start, 'd')}–${format(end, 'd MMM yyyy')}`,
    generatedAt: now.toISOString(),
    ppm: { summary: summarizePpm(ppmTasks, today), byCategory, overdue },
    tickets: {
      total: tickets.length,
      byStatus,
      byCategory: CATEGORIES.map((c) => ({ category: c, label: CATEGORY_LABELS[c], count: tickets.filter((t) => t.category === c).length })),
      avgResponseMs: average(tickets.map(responseMs)),
      avgResolutionMs: average(tickets.map(resolutionMs)),
      repeatRooms,
    },
    energy: {
      totalKwh,
      days: days.length,
      dataThrough: days.length ? energyEnd : null,
      byCampus,
      byBuilding,
      byDayType,
    },
    co2: {
      tonnes: kwhToTonnesCo2(totalKwh),
      byCampus: byCampus.map((c) => ({ label: c.label, tonnes: kwhToTonnesCo2(c.kwh) })),
    },
    alerts: {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      acknowledged: alerts.filter((a) => a.acknowledged).length,
      workOrders: alerts.filter((a) => a.workOrderId).length,
      bySource,
      monitoredAssets: source.assets.filter((a) => a.monitored && matchesCampus(campus, a.campus)).length,
      list: alerts
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .map((a) => ({
          date: format(new Date(a.createdAt), 'd MMM HH:mm'),
          title: a.title,
          building: BUILDINGS.find((b) => b.id === a.buildingId)?.shortName ?? a.buildingId,
          severity: a.severity === 'critical' ? 'Critical' : 'Warning',
          source: SOURCE_LABELS[a.source],
        })),
    },
  }
}
