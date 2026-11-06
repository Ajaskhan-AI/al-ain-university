import { format } from 'date-fns'
import { EMISSION_FACTOR_NOTE, GRID_FACTOR_KG_PER_KWH } from '../lib/co2'
import { fromISODate } from '../lib/dates'
import { formatDuration, formatNumber } from '../lib/format'
import { reportFileName, type MonthlyReport } from '../lib/report'
import {
  COLORS,
  addHeadersAndFooters,
  barChart,
  createDoc,
  drawCover,
  generatedLine,
  kpiBoxes,
  paragraph,
  sectionTitle,
  table,
  type KpiBox,
} from './pdfBase'

/** Which sections the current role may see (from report.section.* permissions). */
export interface ReportSections {
  ppm: boolean
  tickets: boolean
  energy: boolean
  alerts: boolean
}

const pct = (value: number | null) => (value === null ? '-' : `${value}%`)
const kwh = (value: number) => `${formatNumber(Math.round(value))} kWh`
const dateShort = (iso: string) => format(fromISODate(iso), 'd MMM yyyy')

/** Builds the monthly FM & Energy report PDF and triggers the download. */
export function downloadMonthlyReport(report: MonthlyReport, sections: ReportSections): string {
  const doc = createDoc()
  let y = drawCover(doc, 'Al Ain University - Monthly FM & Energy Report', [
    `${report.monthLabel}  ·  ${report.campusLabel}`,
    `Period: ${report.periodLabel}  ·  ${generatedLine(new Date(report.generatedAt))}`,
  ])
  let n = 0
  const next = () => String(++n)

  if (report.isPartial) {
    y = paragraph(doc, y, 'This month is still in progress: all figures are month-to-date.', { italic: true })
  }

  // ---------- 1. Executive summary ----------
  y = sectionTitle(doc, y, next(), 'Executive summary')
  const boxes: KpiBox[] = []
  if (sections.ppm) {
    const p = report.ppm.summary
    boxes.push(
      { label: 'PPM completion', value: pct(p.pct), sub: `${p.done} of ${p.scheduled} due to date`, color: p.pct !== null && p.pct >= 85 ? COLORS.green : COLORS.amber },
      { label: 'PPM overdue', value: String(p.overdue), sub: 'Not yet done', color: p.overdue ? COLORS.red : COLORS.green },
    )
  }
  if (sections.tickets) {
    boxes.push(
      { label: 'Complaints reported', value: String(report.tickets.total), sub: `${report.tickets.byStatus.closed} closed` },
      { label: 'Avg response time', value: formatDuration(report.tickets.avgResponseMs), sub: 'Reported -> assigned' },
    )
  }
  if (sections.energy) {
    boxes.push(
      { label: 'Electricity', value: `${formatNumber(report.energy.totalKwh / 1000, 1)} MWh`, sub: `${report.energy.days} days of meter data`, color: COLORS.navyLight },
      { label: 'Scope 2 CO2 (indicative)', value: `${formatNumber(report.co2.tonnes, 1)} t`, sub: `@ ${GRID_FACTOR_KG_PER_KWH} kg CO2e/kWh`, color: COLORS.navyLight },
    )
  }
  if (sections.alerts) {
    boxes.push({ label: 'Alerts', value: String(report.alerts.total), sub: `${report.alerts.critical} critical`, color: report.alerts.critical ? COLORS.red : COLORS.amber })
  }
  y = kpiBoxes(doc, y, boxes)

  const highlights: string[] = []
  if (sections.ppm && report.ppm.summary.overdue) highlights.push(`${report.ppm.summary.overdue} PPM task(s) are overdue - see section on PPM.`)
  if (sections.tickets && report.tickets.repeatRooms.length)
    highlights.push(`Repeat-fault rooms this month: ${report.tickets.repeatRooms.map((r) => `${r.roomName} (${r.count}x)`).join(', ')}.`)
  if (sections.energy && report.energy.byBuilding[0])
    highlights.push(`Highest consumer: ${report.energy.byBuilding[0].name} (${formatNumber(report.energy.byBuilding[0].sharePct, 0)}% of electricity).`)
  if (highlights.length) y = paragraph(doc, y, highlights.map((h) => `-  ${h}`).join('\n'), { color: COLORS.text })

  // ---------- PPM ----------
  if (sections.ppm) {
    y = sectionTitle(doc, y + 2, next(), 'Planned preventive maintenance (PPM)')
    const s = report.ppm.summary
    y = table(doc, y, {
      head: [['Asset category', 'Due to date', 'Done', 'Still due', 'Overdue', 'Completion']],
      body: [
        ...report.ppm.byCategory.map((c) => [c.label, c.scheduled, c.done, c.due, c.overdue, pct(c.pct)]),
        [{ content: 'Total', styles: { fontStyle: 'bold' } }, s.scheduled, s.done, s.due, s.overdue, { content: pct(s.pct), styles: { fontStyle: 'bold' } }],
      ],
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    })
    if (report.ppm.overdue.length) {
      y = paragraph(doc, y, 'Overdue tasks', { size: 10, color: COLORS.red })
      y = table(doc, y, {
        head: [['Task', 'Title', 'Asset', 'Due date', 'Technician']],
        body: report.ppm.overdue.map((t) => [t.id, t.title, `${t.assetName}\n${t.assetId}`, dateShort(t.dueDate), t.technician]),
        headStyles: { fillColor: COLORS.red },
      })
    } else {
      y = paragraph(doc, y, 'No overdue PPM tasks for this period.')
    }
  }

  // ---------- Complaints ----------
  if (sections.tickets) {
    const t = report.tickets
    y = sectionTitle(doc, y + 2, next(), 'Complaints & work orders')
    y = kpiBoxes(doc, y, [
      { label: 'Reported', value: String(t.total) },
      { label: 'Closed', value: String(t.byStatus.closed), color: COLORS.green },
      { label: 'Avg response', value: formatDuration(t.avgResponseMs), sub: 'Reported -> assigned' },
      { label: 'Avg resolution', value: formatDuration(t.avgResolutionMs), sub: 'Reported -> closed' },
    ])
    y = table(doc, y, {
      head: [['Open', 'Assigned', 'In progress', 'Closed', 'Total']],
      body: [[t.byStatus.open, t.byStatus.assigned, t.byStatus.in_progress, t.byStatus.closed, t.total]],
      styles: { halign: 'center' },
    })
    y = paragraph(doc, y, 'Tickets by category', { size: 10, color: COLORS.navy })
    y = barChart(doc, y, t.byCategory.map((c) => ({ label: c.label, value: c.count, display: String(c.count) })))
    if (t.repeatRooms.length) {
      y = paragraph(doc, y, 'Repeat-fault rooms (3 or more tickets in the month)', { size: 10, color: COLORS.red })
      y = table(doc, y, {
        head: [['Room', 'Room ID', 'Tickets', 'Categories']],
        body: t.repeatRooms.map((r) => [r.roomName, r.roomId, r.count, r.categories]),
        headStyles: { fillColor: COLORS.red },
      })
    } else {
      y = paragraph(doc, y, 'No repeat-fault rooms this month.')
    }
  }

  // ---------- Energy + CO2 ----------
  if (sections.energy) {
    const e = report.energy
    y = sectionTitle(doc, y + 2, next(), 'Energy by building and campus')
    if (!e.days) {
      y = paragraph(doc, y, 'No meter data yet for this period.')
    } else {
      y = table(doc, y, {
        head: [['Campus', 'Electricity', 'Share']],
        body: [
          ...e.byCampus.map((c) => [c.label, kwh(c.kwh), `${formatNumber(e.totalKwh ? (c.kwh / e.totalKwh) * 100 : 0, 1)}%`]),
          [{ content: 'Total', styles: { fontStyle: 'bold' } }, { content: kwh(e.totalKwh), styles: { fontStyle: 'bold' } }, '100%'],
        ],
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      })
      y = paragraph(doc, y, 'Electricity by building', { size: 10, color: COLORS.navy })
      y = barChart(
        doc,
        y,
        e.byBuilding.map((b) => ({ label: b.name, value: b.kwh, display: `${formatNumber(b.kwh / 1000, 1)} MWh` })),
        COLORS.navyLight,
      )
      y = table(doc, y, {
        head: [['Building', 'Campus', 'Electricity', 'Share']],
        body: e.byBuilding.map((b) => [b.name, b.campus === 'AIN' ? 'Al Ain' : 'Abu Dhabi', kwh(b.kwh), `${formatNumber(b.sharePct, 1)}%`]),
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      })
      const teaching = e.byDayType.find((d) => d.dayType === 'teaching')?.avgKwhPerDay
      y = paragraph(doc, y, 'Academic-period comparison (average electricity per day)', { size: 10, color: COLORS.navy })
      y = table(doc, y, {
        head: [['Period type', 'Days', 'Avg per day', 'vs teaching day']],
        body: e.byDayType.map((d) => [
          d.label,
          d.days,
          kwh(d.avgKwhPerDay),
          teaching ? `${formatNumber((d.avgKwhPerDay / teaching) * 100, 0)}%` : '-',
        ]),
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      })
      if (e.dataThrough) y = paragraph(doc, y, `Meter data through ${dateShort(e.dataThrough)}. Period types follow the academic calendar in the app.`)
    }

    y = sectionTitle(doc, y + 2, next(), 'Scope 2 CO2 estimate (indicative)')
    y = kpiBoxes(doc, y, [
      { label: 'Total Scope 2', value: `${formatNumber(report.co2.tonnes, 1)} t CO2e`, color: COLORS.navyLight },
      ...report.co2.byCampus.map((c) => ({ label: c.label, value: `${formatNumber(c.tonnes, 1)} t CO2e`, color: COLORS.navyLight })),
    ])
    y = paragraph(doc, y, EMISSION_FACTOR_NOTE, { italic: true })
    y = paragraph(doc, y, 'Savings potential is to be measured during the pilot; no savings are claimed in this report.', { italic: true })
  }

  // ---------- Alerts & predictive ----------
  if (sections.alerts) {
    const a = report.alerts
    y = sectionTitle(doc, y + 2, next(), 'Alerts & predictive maintenance')
    y = kpiBoxes(doc, y, [
      { label: 'Alerts', value: String(a.total) },
      { label: 'Critical', value: String(a.critical), color: a.critical ? COLORS.red : COLORS.green },
      { label: 'Acknowledged', value: a.total ? `${Math.round((a.acknowledged / a.total) * 100)}%` : '-', sub: `${a.acknowledged} of ${a.total}` },
      { label: 'CT-monitored assets', value: String(a.monitoredAssets), sub: 'Chillers, AHUs, pumps' },
    ])
    if (a.list.length) {
      y = table(doc, y, {
        head: [['Date', 'Alert', 'Building', 'Severity', 'Source']],
        body: a.list.map((x) => [x.date, x.title, x.building, x.severity, x.source]),
      })
    } else {
      y = paragraph(doc, y, 'No alerts in this period.')
    }
  }

  addHeadersAndFooters(doc, `Monthly FM & Energy Report - ${report.monthLabel}`)
  const fileName = reportFileName(report.month, report.campus)
  doc.save(fileName)
  return fileName
}
