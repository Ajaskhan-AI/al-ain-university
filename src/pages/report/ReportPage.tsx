import { format } from 'date-fns'
import { Activity, Download, FileText, Inbox, Leaf, Percent, TriangleAlert, Zap } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { can } from '../../auth/permissions'
import { ROLE_LABELS } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { CAMPUS_FILTER_LABELS } from '../../data/campuses'
import { EMISSION_FACTOR_NOTE } from '../../lib/co2'
import { fromISODate } from '../../lib/dates'
import { formatDuration, formatNumber } from '../../lib/format'
import { buildMonthlyReport, defaultReportMonth, reportFileName, reportMonths } from '../../lib/report'
import type { ReportSections } from '../../pdf/monthlyReport'
import { useAppState } from '../../store/hooks'
import type { CampusFilter } from '../../types'

const CAMPUS_OPTIONS: CampusFilter[] = ['AIN', 'AUH', 'ALL']

/** Monthly FM & Energy Report: pick month + campus, preview the numbers, download a real PDF. */
export default function ReportPage() {
  const state = useAppState()
  const user = useCurrentUser()
  const toast = useToast()
  const now = useMemo(() => new Date(), [])

  const locked = !!user && user.campus !== 'ALL'
  const [month, setMonth] = useState(() => defaultReportMonth(now))
  const [campusChoice, setCampusChoice] = useState<CampusFilter>(state.campus)
  const campus: CampusFilter = locked && user ? user.campus : campusChoice
  const [busy, setBusy] = useState(false)

  const sections: ReportSections = {
    ppm: can(user, 'report.section.ppm'),
    tickets: can(user, 'report.section.tickets'),
    energy: can(user, 'report.section.energy'),
    alerts: can(user, 'report.section.alerts'),
  }
  const canDownload = can(user, 'report.download')

  // Recalculated from the live store, so demo actions show up immediately.
  const report = buildMonthlyReport(state, month, campus, now)

  const download = async () => {
    setBusy(true)
    try {
      // Load the PDF library only when needed (keeps the app itself fast to open).
      const { downloadMonthlyReport } = await import('../../pdf/monthlyReport')
      const fileName = downloadMonthlyReport(buildMonthlyReport(state, month, campus, new Date()), sections)
      toast.show(`Downloaded ${fileName}`)
    } catch (error) {
      console.error(error)
      toast.show('Could not create the PDF', 'alert')
    } finally {
      setBusy(false)
    }
  }

  const sectionNames = [sections.ppm && 'PPM', sections.tickets && 'Complaints', sections.energy && 'Energy & CO₂', sections.alerts && 'Alerts'].filter(Boolean)
  const t = report.tickets
  const p = report.ppm.summary
  const maxBuilding = Math.max(1, ...report.energy.byBuilding.map((b) => b.kwh))
  const teachingAvg = report.energy.byDayType.find((d) => d.dayType === 'teaching')?.avgKwhPerDay

  return (
    <>
      <PageHeader
        title="Monthly FM & Energy Report"
        description="Calculated from the live data — tickets and PPM completed during this demo appear in the report."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy-800">Month</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} min-w-56`}>
              {reportMonths(now).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy-800">Campus</span>
            <select
              value={campus}
              disabled={locked}
              onChange={(e) => setCampusChoice(e.target.value as CampusFilter)}
              className={`${inputClass} min-w-48 disabled:bg-navy-50`}
            >
              {CAMPUS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CAMPUS_FILTER_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <Button variant="teal" size="lg" onClick={download} disabled={!canDownload || busy}>
              <Download className="size-5" aria-hidden />
              {busy ? 'Creating PDF…' : 'Download PDF'}
            </Button>
          </div>
          <p className="text-sm text-navy-500">
            <FileText className="mr-1 inline size-4" aria-hidden />
            {reportFileName(month, campus)}
          </p>
        </div>
        <p className="mt-3 text-sm text-navy-500">
          {user && <>As <strong>{ROLE_LABELS[user.role]}</strong> your report includes: {sectionNames.join(', ')}.</>}
          {locked && ' Campus is fixed to your own campus.'}
          {!canDownload && ' Your role can preview the report; downloading is for FM roles.'}
        </p>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-navy-900">
          {report.monthLabel} · {report.campusLabel}
        </h2>
        {report.isPartial && <Badge tone="warn">Month to date</Badge>}
        <span className="text-sm text-navy-500">{report.periodLabel}</span>
      </div>

      {/* Executive summary */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sections.ppm && (
          <KpiCard label="PPM completion" value={p.pct === null ? '—' : `${p.pct}%`} sub={`${p.done} of ${p.scheduled} due to date · ${p.overdue} overdue`} icon={Percent} tone={p.overdue ? 'warn' : 'ok'} />
        )}
        {sections.tickets && (
          <KpiCard label="Complaints" value={t.total} sub={`${t.byStatus.closed} closed · avg response ${formatDuration(t.avgResponseMs)}`} icon={Inbox} tone="info" />
        )}
        {sections.energy && (
          <>
            <KpiCard label="Electricity" value={`${formatNumber(report.energy.totalKwh / 1000, 1)} MWh`} sub={`${report.energy.days} days of meter data`} icon={Zap} tone="neutral" />
            <KpiCard label="Scope 2 CO₂ (indicative)" value={`${formatNumber(report.co2.tonnes, 1)} t`} sub="Location-based, 0.40 kg/kWh" icon={Leaf} tone="ok" />
          </>
        )}
        {sections.alerts && (
          <KpiCard label="Alerts" value={report.alerts.total} sub={`${report.alerts.critical} critical · ${report.alerts.acknowledged} acknowledged`} icon={TriangleAlert} tone={report.alerts.critical ? 'alert' : 'warn'} />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {sections.ppm && (
          <Card title="Planned preventive maintenance" subtitle="Tasks due in the month, by asset category">
            <SimpleTable
              head={['Category', 'Due to date', 'Done', 'Still due', 'Overdue', 'Completion']}
              rows={[
                ...report.ppm.byCategory.map((c) => [c.label, c.scheduled, c.done, c.due, c.overdue, c.pct === null ? '—' : `${c.pct}%`]),
                [<strong key="t">Total</strong>, p.scheduled, p.done, p.due, p.overdue, <strong key="p">{p.pct === null ? '—' : `${p.pct}%`}</strong>],
              ]}
            />
            {report.ppm.overdue.length > 0 && (
              <>
                <p className="mt-4 mb-2 text-sm font-semibold text-red-700">Overdue tasks ({report.ppm.overdue.length})</p>
                <SimpleTable
                  head={['Task', 'Asset', 'Due', 'Technician']}
                  rows={report.ppm.overdue.map((o) => [`${o.title} (${o.id})`, o.assetName, format(fromISODate(o.dueDate), 'd MMM'), o.technician])}
                />
              </>
            )}
          </Card>
        )}

        {sections.tickets && (
          <Card title="Complaints & work orders" subtitle={`Avg response ${formatDuration(t.avgResponseMs)} · avg resolution ${formatDuration(t.avgResolutionMs)}`}>
            <SimpleTable
              head={['Open', 'Assigned', 'In progress', 'Closed', 'Total']}
              rows={[[t.byStatus.open, t.byStatus.assigned, t.byStatus.in_progress, t.byStatus.closed, t.total]]}
            />
            <ul className="mt-4 space-y-2">
              {t.byCategory.map((c) => (
                <li key={c.category} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-sm">
                  <span className="text-navy-700">{c.label}</span>
                  <span className="h-2 rounded-full bg-navy-50">
                    <span className="block h-2 rounded-full bg-teal-500" style={{ width: `${(c.count / Math.max(1, ...t.byCategory.map((x) => x.count))) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-navy-700">
              <strong>Repeat-fault rooms:</strong>{' '}
              {t.repeatRooms.length ? t.repeatRooms.map((r) => `${r.roomName} (${r.count}×)`).join(', ') : 'none this month'}
            </p>
          </Card>
        )}

        {sections.energy && (
          <Card title="Energy by building" subtitle={report.energy.byCampus.map((c) => `${c.label}: ${formatNumber(c.kwh / 1000, 1)} MWh`).join(' · ')}>
            <ul className="space-y-2">
              {report.energy.byBuilding.map((b) => (
                <li key={b.id} className="grid grid-cols-[minmax(0,12rem)_1fr_5.5rem] items-center gap-2 text-sm">
                  <span className="truncate text-navy-700">{b.name}</span>
                  <span className="h-2.5 rounded-full bg-navy-50">
                    <span className="block h-2.5 rounded-full bg-navy-500" style={{ width: `${(b.kwh / maxBuilding) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{formatNumber(b.kwh / 1000, 1)} MWh</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 mb-2 text-sm font-semibold text-navy-800">Academic-period comparison (avg per day)</p>
            <SimpleTable
              head={['Period type', 'Days', 'Avg per day', 'vs teaching']}
              rows={report.energy.byDayType.map((d) => [
                d.label,
                d.days,
                `${formatNumber(d.avgKwhPerDay)} kWh`,
                teachingAvg ? `${formatNumber((d.avgKwhPerDay / teachingAvg) * 100)}%` : '—',
              ])}
            />
            <p className="mt-4 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-600">
              <strong>Scope 2 CO₂:</strong> {formatNumber(report.co2.tonnes, 1)} t CO₂e. {EMISSION_FACTOR_NOTE}
            </p>
          </Card>
        )}

        {sections.alerts && (
          <Card title="Alerts & predictive maintenance" subtitle={`${report.alerts.monitoredAssets} CT-monitored assets now: ${report.alerts.predictive.ok} OK · ${report.alerts.predictive.watch} watch · ${report.alerts.predictive.alert} alert`}>
            {report.alerts.list.length ? (
              <SimpleTable
                head={['Date', 'Alert', 'Building', 'Severity']}
                rows={report.alerts.list.map((a) => [
                  a.date,
                  a.title,
                  a.building,
                  <Badge key="s" tone={a.severity === 'Critical' ? 'alert' : 'warn'}>
                    {a.severity}
                  </Badge>,
                ])}
              />
            ) : (
              <p className="flex items-center gap-2 text-sm text-navy-500">
                <Activity className="size-4" aria-hidden /> No alerts in this period.
              </p>
            )}
          </Card>
        )}
      </div>
    </>
  )
}

function SimpleTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-semibold tracking-wide text-navy-500 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`border-b border-navy-100 py-2 ${i === 0 ? 'pr-3' : 'px-2 text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-50">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i} className={`py-2 ${i === 0 ? 'pr-3 text-navy-800' : 'px-2 text-right tabular-nums text-navy-700'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
