import { format, startOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { BellRing, ChevronRight, Flag, HeartPulse, Inbox, Leaf, Percent, Zap } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { AlertCard } from '../../components/alerts/AlertCard'
import { LiveIndicator } from '../../components/smdb/SmdbBits'
import { CATEGORY_ICONS } from '../../components/tickets/categoryIcons'
import { TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { KpiCard } from '../../components/ui/KpiCard'
import { getBuilding } from '../../data/buildings'
import { CAMPUS_FILTER_LABELS } from '../../data/campuses'
import { getEnergyHistory } from '../../data/energy'
import { SMDBS } from '../../data/smdbs'
import { DAY_TYPE_LABELS, resolveDayType } from '../../lib/calendar'
import { filterByCampus, matchesCampus } from '../../lib/campus'
import { kwhToTonnesCo2 } from '../../lib/co2'
import { fromISODate, toISODate } from '../../lib/dates'
import { LOW_OCCUPANCY, analyseEnergy } from '../../lib/energyAnalysis'
import { formatAgo, formatNumber } from '../../lib/format'
import { summarizePpm, visiblePpmTasks } from '../../lib/ppm'
import { CATEGORIES, CATEGORY_LABELS, createdSince, ticketLocation } from '../../lib/tickets'
import { energyBetween } from '../../sim/smdbModel'
import { useSimulator } from '../../sim/simulatorContext'
import { usePredictive } from '../../sim/usePredictive'
import { useAppState } from '../../store/hooks'

const AXIS = { fontSize: 11, fill: '#5f80b8' }

/**
 * Overview: every number is calculated live from the store and the simulator
 * (nothing hard-coded). Each role only sees its own KPI groups.
 */
export default function OverviewPage() {
  const state = useAppState()
  const user = useCurrentUser()
  const sim = useSimulator()
  const assessments = usePredictive()
  const { campus, calendar } = state

  const show = {
    alerts: can(user, 'overview.kpi.alerts'),
    ppm: can(user, 'overview.kpi.ppm'),
    tickets: can(user, 'overview.kpi.tickets'),
    energy: can(user, 'overview.kpi.energy'),
  }

  const now = new Date()
  const today = toISODate(now)

  // ---------- Alerts ----------
  const activeAlerts = filterByCampus(state.alerts, campus)
    .filter((a) => !a.resolvedAt)
    .sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical') || b.createdAt.localeCompare(a.createdAt))
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical').length

  // ---------- Tickets ----------
  const tickets = filterByCampus(state.tickets, campus)
  const openTickets = tickets.filter((t) => t.status !== 'closed')
  const unassigned = tickets.filter((t) => t.status === 'open').length
  const last30 = createdSince(tickets, subDays(now, 30))
  const byCategory = CATEGORIES.map((c) => ({ c, n: last30.filter((t) => t.category === c).length })).filter((x) => x.n > 0)
  const maxCat = Math.max(1, ...byCategory.map((x) => x.n))
  const recentTickets = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  // ---------- PPM ----------
  const ppmTasks = visiblePpmTasks(state.ppmTasks, state.assets, campus, user)
  const ppm = summarizePpm(ppmTasks, today, toISODate(startOfMonth(now)), toISODate(endOfMonth(now)))
  const overdueAll = summarizePpm(ppmTasks, today).overdue

  // ---------- Energy ----------
  const history = getEnergyHistory(now) // cached per day inside getEnergyHistory
  const analysis = useMemo(() => analyseEnergy(history, calendar), [history, calendar])
  const boards = filterByCampus(SMDBS, campus)
  const liveKw = boards.reduce((s, b) => s + (sim.readings[b.id]?.kW ?? 0), 0)
  // Today so far = load model integrated from midnight (meter history ends yesterday).
  const todayKwh = boards.reduce((s, b) => s + energyBetween(b, startOfDay(now), now, calendar), 0)
  const monthStart = toISODate(startOfMonth(now))
  const monthKwh = history.filter((r) => matchesCampus(campus, r.campus) && r.date >= monthStart).reduce((s, r) => s + r.kWh, 0) + todayKwh
  const co2Month = kwhToTonnesCo2(monthKwh)

  // Live load: sum of all boards over the last 24 h + the live point.
  const first = boards[0] ? sim.history[boards[0].id] : []
  const live24 = first.map((p, i) => ({ t: p.t, kW: Math.round(boards.reduce((s, b) => s + (sim.history[b.id]?.[i]?.kW ?? 0), 0)) }))
  const liveSeries = [...live24, { t: sim.updatedAt, kW: Math.round(liveKw) }]

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const date = toISODate(subDays(now, 14 - i))
    const kWh = history.filter((r) => r.date === date && matchesCampus(campus, r.campus)).reduce((s, r) => s + r.kWh, 0)
    const type = resolveDayType(fromISODate(date), calendar)
    return { date, label: format(fromISODate(date), 'EEE d'), kWh, low: LOW_OCCUPANCY.includes(type), type }
  })

  const from30 = toISODate(subDays(now, 30))
  const openFlags = analysis.flags.filter((f) => f.date >= from30 && matchesCampus(campus, f.campus) && !state.reviewedWasteIds.includes(f.id))
  const flagExcess = openFlags.reduce((s, f) => s + f.excessKwh, 0)

  // ---------- Predictive ----------
  const health = assessments.filter((a) => {
    const asset = state.assets.find((x) => x.id === a.assetId)
    return asset && matchesCampus(campus, asset.campus)
  })
  const healthCount = (s: string) => health.filter((a) => a.status === s).length

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            {greeting}, {firstName(user?.name ?? '')}
          </h1>
          <p className="mt-1 text-navy-500">
            {CAMPUS_FILTER_LABELS[campus]} · {format(now, 'EEEE d MMMM yyyy')} · {DAY_TYPE_LABELS[resolveDayType(now, calendar)]}
          </p>
        </div>
        <LiveIndicator updatedAt={sim.updatedAt} intervalMs={sim.intervalMs} />
      </div>

      {/* KPI row — every card links to its module */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {show.alerts && (
          <KpiCard
            label="Active alerts"
            value={activeAlerts.length}
            sub={criticalAlerts ? `${criticalAlerts} critical` : 'None critical'}
            icon={BellRing}
            tone={criticalAlerts ? 'alert' : activeAlerts.length ? 'warn' : 'ok'}
            to="/smdb/alerts"
          />
        )}
        {show.tickets && (
          <KpiCard
            label="Open tickets"
            value={openTickets.length}
            sub={`${unassigned} waiting for assignment`}
            icon={Inbox}
            tone={unassigned ? 'warn' : 'ok'}
            to="/complaints"
          />
        )}
        {show.ppm && (
          <KpiCard
            label={`PPM completion — ${format(now, 'MMM')}`}
            value={ppm.pct === null ? '—' : `${ppm.pct}%`}
            sub={`${ppm.done} of ${ppm.scheduled} due to date · ${overdueAll} overdue`}
            icon={Percent}
            tone={ppm.pct === null ? 'neutral' : ppm.pct >= 85 ? 'ok' : ppm.pct >= 60 ? 'warn' : 'alert'}
            to={overdueAll ? '/ppm?tab=tasks&status=overdue' : '/ppm'}
          />
        )}
        {show.energy && (
          <>
            <KpiCard
              label="Today’s electricity"
              value={`${formatNumber(todayKwh / 1000, 1)} MWh`}
              sub={`So far · live load ${formatNumber(liveKw)} kW`}
              icon={Zap}
              tone="info"
              to="/energy"
            />
            <KpiCard
              label={`CO₂ — ${format(now, 'MMMM')}`}
              value={`${formatNumber(co2Month, 1)} t`}
              sub="Scope 2, month to date (indicative)"
              icon={Leaf}
              tone="neutral"
              to="/report"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {show.energy && (
          <Card
            className="lg:col-span-2"
            title="Live electrical load — last 24 h"
            subtitle={`${boards.length} SMDBs · now ${formatNumber(liveKw)} kW`}
            actions={<CardLink to="/smdb" label="SMDB monitoring" />}
          >
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveSeries} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ovLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e3eaf5" vertical={false} />
                  <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(t: number) => format(t, 'HH:mm')} tick={AXIS} />
                  <YAxis tickFormatter={(v: number) => `${formatNumber(v)}`} tick={AXIS} width={48} />
                  <Tooltip labelFormatter={(t) => format(Number(t), 'EEE HH:mm')} formatter={(v) => [`${formatNumber(Number(v))} kW`, 'Load']} />
                  <Area type="monotone" dataKey="kW" stroke="#0d9488" strokeWidth={2} fill="url(#ovLoad)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {show.alerts && (
          <Card title="Active alerts" subtitle="SMDB and predictive" actions={<CardLink to="/smdb/alerts" label="Alerts center" />}>
            {activeAlerts.length ? (
              <div className="space-y-3">
                {activeAlerts.slice(0, 3).map((a) => (
                  <AlertCard key={a.id} alert={a} compact />
                ))}
                {activeAlerts.length > 3 && <p className="text-sm text-navy-500">+{activeAlerts.length - 3} more</p>}
              </div>
            ) : (
              <EmptyState icon={BellRing} title="No active alerts" />
            )}
          </Card>
        )}

        {show.energy && (
          <Card
            className="lg:col-span-2"
            title="Electricity — last 14 days"
            subtitle="Navy = teaching / exam days · amber = weekends, holidays and breaks"
            actions={<CardLink to="/energy" label="Energy analytics" />}
          >
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last14} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#e3eaf5" vertical={false} />
                  <XAxis dataKey="label" tick={AXIS} interval={0} />
                  <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={AXIS} width={40} />
                  <Tooltip
                    formatter={(v) => [`${formatNumber(Number(v))} kWh`, 'Electricity']}
                    labelFormatter={(_l, p) => {
                      const d = p?.[0]?.payload as (typeof last14)[number] | undefined
                      return d ? `${format(fromISODate(d.date), 'EEE d MMM')} · ${DAY_TYPE_LABELS[d.type]}` : ''
                    }}
                  />
                  <Bar dataKey="kWh" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {last14.map((d) => (
                      <Cell key={d.date} fill={d.low ? '#f59e0b' : '#2a4a82'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {show.energy && (
          <Card title="Energy waste flags" subtitle="Last 30 days, not yet reviewed" actions={<CardLink to="/energy?tab=waste" label="Review" />}>
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-warn-soft text-amber-700">
                <Flag className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-3xl font-bold text-navy-900">{openFlags.length}</p>
                <p className="text-sm text-navy-500">
                  days with use above occupancy · +{formatNumber(flagExcess / 1000, 1)} MWh
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-navy-700">
              {[...new Set(openFlags.map((f) => f.buildingId))].slice(0, 3).map((id) => {
                const f = openFlags.filter((x) => x.buildingId === id)
                return (
                  <li key={id} className="flex justify-between gap-2">
                    <span className="truncate">{getBuilding(id)?.name ?? id}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{f.length} days</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {show.ppm && (
          <Card title={`PPM — ${format(now, 'MMMM')}`} subtitle="Tasks due this month" actions={<CardLink to="/ppm" label="Logbook & PPM" />}>
            <div className="flex h-4 overflow-hidden rounded-full bg-navy-50">
              {[
                ['bg-green-500', ppm.done],
                ['bg-amber-500', ppm.due],
                ['bg-red-500', ppm.overdue],
              ].map(([color, n]) => (
                <span key={color as string} className={color as string} style={{ width: `${((n as number) / Math.max(1, ppm.done + ppm.due + ppm.overdue)) * 100}%` }} />
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Done', ppm.done, 'text-green-700'],
                ['Due', ppm.due, 'text-amber-700'],
                ['Overdue', ppm.overdue, 'text-red-700'],
              ].map(([label, n, color]) => (
                <div key={label as string} className="rounded-lg bg-navy-50/60 py-2">
                  <dd className={`text-2xl font-bold ${color as string}`}>{n}</dd>
                  <dt className="text-xs text-navy-500">{label}</dt>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {show.alerts && can(user, 'predictive.view') && (
          <Card title="Asset health" subtitle={`${health.length} CT-monitored assets`} actions={<CardLink to="/predictive" label="Predictive" />}>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ['OK', healthCount('ok'), 'text-green-700'],
                ['Watch', healthCount('watch'), 'text-amber-700'],
                ['Alert', healthCount('alert'), 'text-red-700'],
              ].map(([label, n, color]) => (
                <div key={label as string} className="rounded-lg bg-navy-50/60 py-2">
                  <dd className={`text-2xl font-bold ${color as string}`}>{n}</dd>
                  <dt className="text-xs text-navy-500">{label}</dt>
                </div>
              ))}
            </dl>
            <ul className="mt-3 space-y-1.5 text-sm">
              {health
                .filter((a) => a.status !== 'ok')
                .sort((a, b) => a.health - b.health)
                .map((a) => (
                  <li key={a.assetId}>
                    <Link to={`/predictive/${a.assetId}`} className="flex items-center justify-between gap-2 hover:text-teal-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <HeartPulse className={a.status === 'alert' ? 'size-4 text-red-600' : 'size-4 text-amber-600'} aria-hidden />
                        {state.assets.find((x) => x.id === a.assetId)?.name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{a.health}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        )}

        {show.tickets && (
          <Card title="Tickets by category" subtitle="Last 30 days" actions={<CardLink to="/complaints" label="Complaints" />}>
            <ul className="space-y-2.5">
              {byCategory.map(({ c, n }) => {
                const Icon = CATEGORY_ICONS[c]
                return (
                  <li key={c} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-navy-700">
                      <Icon className="size-4" aria-hidden />
                      {CATEGORY_LABELS[c]}
                    </span>
                    <span className="h-2 rounded-full bg-navy-50">
                      <span className="block h-2 rounded-full bg-teal-500" style={{ width: `${(n / maxCat) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums">{n}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {show.tickets && (
          <Card title="Latest tickets" actions={<CardLink to="/complaints" label="All" />} flush>
            <ul className="divide-y divide-navy-50">
              {recentTickets.map((t) => (
                <li key={t.id}>
                  <Link to={`/complaints/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-navy-50/60">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy-900">
                        {t.id} · {t.description}
                      </span>
                      <span className="block truncate text-xs text-navy-500">
                        {ticketLocation(t, state.rooms)} · {formatAgo(t.createdAt)}
                      </span>
                    </span>
                    <TicketStatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  )
}

/** "Ahmed Al Mansoori" → "Ahmed", "Dr. Layla Hassan" → "Dr. Layla". */
function firstName(name: string): string {
  const parts = name.split(' ')
  return parts[0] === 'Dr.' ? parts.slice(0, 2).join(' ') : parts[0]
}

function CardLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-0.5 text-sm font-medium text-teal-700 hover:underline">
      {label}
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  )
}
