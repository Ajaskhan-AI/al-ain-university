import { format } from 'date-fns'
import { getBuilding } from '../data/buildings'
import { CHECKLIST_TEMPLATES } from '../data/checklists'
import { fromISODate, toISODate } from '../lib/dates'
import { ASSET_CATEGORY_LABELS, FREQUENCY_LABELS, PPM_STATUS_LABELS, getPpmStatus, isReadingOutOfRange } from '../lib/ppm'
import type { Asset, PpmTask, Technician } from '../types'
import { COLORS, addHeadersAndFooters, createDoc, drawCover, generatedLine, kpiBoxes, paragraph, sectionTitle, table } from './pdfBase'

/** One asset's PPM logbook as a PDF: details, open tasks, and every completed checklist. */
export function downloadAssetHistoryPdf(asset: Asset, tasks: PpmTask[], technicians: Technician[]): string {
  const doc = createDoc()
  const today = toISODate(new Date())
  const building = getBuilding(asset.buildingId)
  const template = CHECKLIST_TEMPLATES[asset.category]
  const done = tasks.filter((t) => t.completion).sort((a, b) => (b.completion?.at ?? '').localeCompare(a.completion?.at ?? ''))
  const open = tasks.filter((t) => !t.completion).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const overdue = open.filter((t) => getPpmStatus(t, today) === 'overdue').length

  let y = drawCover(doc, 'Asset PPM history', [`${asset.name}  ·  ${asset.id}`, `${building?.name ?? asset.buildingId}, ${asset.location}  ·  ${generatedLine()}`])

  y = kpiBoxes(doc, y, [
    { label: 'Checklists completed', value: String(done.length), color: COLORS.green },
    { label: 'Open tasks', value: String(open.length), color: COLORS.amber },
    { label: 'Overdue', value: String(overdue), color: overdue ? COLORS.red : COLORS.green },
    { label: 'Last PPM', value: done[0]?.completion ? format(new Date(done[0].completion.at), 'd MMM yyyy') : '-' },
  ])

  y = sectionTitle(doc, y, '', 'Asset details')
  y = table(doc, y, {
    head: [['Field', 'Value']],
    body: [
      ['QR tag ID', asset.id],
      ['Category', ASSET_CATEGORY_LABELS[asset.category]],
      ['Description', asset.description],
      ['Location', `${building?.name ?? asset.buildingId} - ${asset.location}`],
      ['Installed', String(asset.installYear)],
      ['Maintained by', `${asset.trade.toUpperCase()} team`],
      ['Condition monitoring', asset.monitored ? 'CT clamps fitted (predictive maintenance)' : 'Not monitored'],
    ],
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } },
  })

  y = sectionTitle(doc, y, '', 'Open PPM tasks')
  if (open.length) {
    y = table(doc, y, {
      head: [['Task', 'Title', 'Frequency', 'Due date', 'Status', 'Technician']],
      body: open.map((t) => [
        t.id,
        t.title,
        FREQUENCY_LABELS[t.frequency],
        format(fromISODate(t.dueDate), 'd MMM yyyy'),
        PPM_STATUS_LABELS[getPpmStatus(t, today)],
        technicians.find((x) => x.id === t.assignedTechnicianId)?.name ?? 'Unassigned',
      ]),
    })
  } else {
    y = paragraph(doc, y, 'No open PPM tasks.')
  }

  y = sectionTitle(doc, y, '', 'Maintenance history (completed checklists)')
  if (done.length) {
    table(doc, y, {
      head: [['Completed', 'Task', 'Technician', 'Readings', 'Remarks']],
      body: done.map((t) => {
        const c = t.completion!
        const readings = template
          .filter((item) => item.kind === 'reading')
          .map((item) => {
            const value = c.results[item.id]
            const unit = item.kind === 'reading' ? item.unit : ''
            return `${item.label}: ${typeof value === 'number' ? value : '-'} ${unit}${isReadingOutOfRange(item, value) ? ' (!)' : ''}`
          })
          .join('\n')
        const failed = template.filter((item) => item.kind === 'check' && c.results[item.id] === false).map((item) => `Not OK: ${item.label}`)
        return [
          format(new Date(c.at), 'd MMM yyyy, HH:mm'),
          `${t.title}\n${t.id} · ${FREQUENCY_LABELS[t.frequency]}`,
          c.technicianName,
          readings || '-',
          [c.remarks, ...failed].join('\n'),
        ]
      }),
      columnStyles: { 0: { cellWidth: 26 }, 2: { cellWidth: 26 }, 3: { cellWidth: 52 } },
    })
  } else {
    paragraph(doc, y, 'No completed PPM yet.')
  }

  addHeadersAndFooters(doc, `Asset PPM history - ${asset.id}`)
  const fileName = `AAU-Asset-${asset.id}-PPM-History.pdf`
  doc.save(fileName)
  return fileName
}
