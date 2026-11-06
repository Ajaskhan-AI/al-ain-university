import clsx from 'clsx'
import { subDays } from 'date-fns'
import { Clock, Gauge, Inbox, LayoutGrid, List, Plus, QrCode, Repeat, Search, ShieldCheck, Timer, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CATEGORY_ICONS } from '../../components/tickets/categoryIcons'
import { NewTicketModal } from '../../components/tickets/NewTicketModal'
import { QuickAssign } from '../../components/tickets/QuickAssign'
import { SlaBadge } from '../../components/tickets/SlaBadge'
import { TicketCard } from '../../components/tickets/TicketCard'
import { PriorityBadge, TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { TicketPanel } from '../../components/tickets/TicketPanel'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClass, inlineSelectClass, inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { BUILDINGS } from '../../data/buildings'
import { filterByCampus } from '../../lib/campus'
import { formatAgo, formatDuration } from '../../lib/format'
import { currentSla, slaMetRate } from '../../lib/sla'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  average,
  createdSince,
  repeatFaultRooms,
  responseMs,
  sortTicketsForWork,
  ticketLocation,
} from '../../lib/tickets'
import { useNow } from '../../lib/useNow'
import { useAppState } from '../../store/hooks'
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../types'

type View = 'board' | 'list'
type Tab = 'all' | TicketStatus
const STATUSES: TicketStatus[] = ['open', 'assigned', 'in_progress', 'closed']
const COLUMN_STYLE: Record<TicketStatus, string> = {
  open: 'border-t-red-500',
  assigned: 'border-t-amber-500',
  in_progress: 'border-t-sky-500',
  closed: 'border-t-green-500',
}
const COLUMN_HINT: Record<TicketStatus, string> = {
  open: 'Waiting for a technician',
  assigned: 'Technician to start',
  in_progress: 'Being fixed',
  closed: 'Closed in the last 7 days',
}

/** Module 4: triage board / list of complaints, with SLA tracking and quick assignment. */
export default function ComplaintsPage() {
  const { tickets, rooms, technicians, campus } = useAppState()
  const user = useCurrentUser()
  const toast = useToast()
  const now = useNow()

  // View and the open ticket live in the URL (?view=list&ticket=WO-1031) so they survive refresh and can be linked.
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'list' ? 'list' : 'board'
  const panelId = params.get('ticket')
  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: key !== 'ticket' },
    )

  const [tab, setTab] = useState<Tab>(user?.role === 'helpdesk' ? 'open' : 'all')
  const [category, setCategory] = useState<TicketCategory | 'all'>('all')
  const [priority, setPriority] = useState<TicketPriority | 'all'>('all')
  const [buildingId, setBuildingId] = useState('all')
  const [techId, setTechId] = useState('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const canAssign = can(user, 'tickets.assign')
  const scoped = filterByCampus(tickets, campus)
  const campusBuildings = filterByCampus(BUILDINGS, campus)
  const campusTechs = filterByCampus(technicians, campus)
  const activeBuilding = campusBuildings.some((b) => b.id === buildingId) ? buildingId : 'all'
  const activeTech = campusTechs.some((t) => t.id === techId) ? techId : 'all'
  const filtersOn = category !== 'all' || priority !== 'all' || activeBuilding !== 'all' || activeTech !== 'all' || search.trim() !== ''
  const clearFilters = () => {
    setCategory('all')
    setPriority('all')
    setBuildingId('all')
    setTechId('all')
    setSearch('')
  }

  const query = search.trim().toLowerCase()
  const filtered = scoped.filter(
    (t) =>
      (category === 'all' || t.category === category) &&
      (priority === 'all' || t.priority === priority) &&
      (activeBuilding === 'all' || t.buildingId === activeBuilding) &&
      (activeTech === 'all' || t.assignedTechnicianId === activeTech) &&
      (!query ||
        [t.id, t.roomId ?? '', t.description, t.requesterName ?? '', ticketLocation(t, rooms)].some((f) => f.toLowerCase().includes(query))),
  )

  // KPIs
  const last30 = createdSince(scoped, subDays(now, 30))
  const open = scoped.filter((t) => t.status !== 'closed')
  const waiting = scoped.filter((t) => t.status === 'open')
  const overdueNow = open.filter((t) => currentSla(t, now).clock.status === 'breached').length
  const slaRate = slaMetRate(last30, now)
  const openTicket = (id: string) => setParam('ticket', id)

  return (
    <>
      <PageHeader
        title="Complaints & Work Orders"
        description="From a room QR code to a closed work order — triage, assign and track every complaint against its service level."
        actions={
          <>
            <Link to="/complaints/rooms" className={buttonClass('secondary')}>
              <QrCode className="size-4" aria-hidden />
              Room QR codes
            </Link>
            {can(user, 'tickets.create') && (
              <Button variant="teal" onClick={() => setShowNew(true)}>
                <Plus className="size-4" aria-hidden />
                New complaint
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open tickets" value={open.length} sub={`${waiting.length} waiting for a technician`} icon={Inbox} tone={waiting.length ? 'warn' : 'ok'} />
        <KpiCard label="Past SLA now" value={overdueNow} sub="Open tickets beyond their target" icon={Clock} tone={overdueNow ? 'alert' : 'ok'} />
        <KpiCard label="Avg response" value={formatDuration(average(last30.map(responseMs)))} sub="Reported → assigned, 30 days" icon={Timer} tone="info" />
        <KpiCard
          label="SLA met"
          value={slaRate === null ? '—' : `${slaRate}%`}
          sub="Response + fix targets, 30 days"
          icon={ShieldCheck}
          tone={slaRate === null ? 'neutral' : slaRate >= 85 ? 'ok' : slaRate >= 65 ? 'warn' : 'alert'}
        />
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="View" className="inline-flex rounded-lg border border-navy-200 bg-white p-0.5">
          {[
            ['board', 'Board', LayoutGrid],
            ['list', 'List', List],
          ].map(([id, label, Icon]) => {
            const I = Icon as typeof List
            return (
              <button
                key={id as string}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setParam('view', id === 'board' ? null : (id as string))}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                  view === id ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50',
                )}
              >
                <I className="size-4" aria-hidden />
                {label as string}
              </button>
            )
          })}
        </div>
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search tickets</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-400" aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, room, description…" className={clsx(inputClass, 'pl-9')} />
        </label>
        <FilterSelect label="Category" value={category} onChange={(v) => setCategory(v as TicketCategory | 'all')}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Priority" value={priority} onChange={(v) => setPriority(v as TicketPriority | 'all')}>
          <option value="all">All priorities</option>
          {(['high', 'medium', 'low'] as TicketPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]} priority
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Building" value={activeBuilding} onChange={setBuildingId}>
          <option value="all">All buildings</option>
          {campusBuildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Technician" value={activeTech} onChange={setTechId}>
          <option value="all">All technicians</option>
          {campusTechs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </FilterSelect>
        {filtersOn && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" aria-hidden />
            Clear
          </Button>
        )}
      </div>

      <div className="mt-4">
        {view === 'board' ? (
          <Board tickets={filtered} now={now} canAssign={canAssign} onOpen={openTicket} onShowClosed={() => { setParam('view', 'list'); setTab('closed') }} />
        ) : (
          <TicketList tickets={filtered} tab={tab} setTab={setTab} now={now} canAssign={canAssign} onOpen={openTicket} />
        )}
      </div>

      <Insights
        tickets={scoped}
        now={now}
        campusTechs={campusTechs}
        activeTech={activeTech}
        category={category}
        onCategory={(c) => setCategory(category === c ? 'all' : c)}
        onTech={(id) => setTechId(activeTech === id ? 'all' : id)}
        onRoom={(roomId) => {
          setSearch(roomId)
          setTab('all')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {panelId && <TicketPanel ticketId={panelId} onClose={() => setParam('ticket', null)} onOpenTicket={openTicket} />}

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false)
            toast.show(`Ticket ${id} created`)
            openTicket(id)
          }}
        />
      )}
    </>
  )
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={clsx(inlineSelectClass, value !== 'all' && 'border-teal-500 bg-teal-50')}>
      {children}
    </select>
  )
}

/** Kanban board: one column per status. */
function Board({
  tickets,
  now,
  canAssign,
  onOpen,
  onShowClosed,
}: {
  tickets: Ticket[]
  now: number
  canAssign: boolean
  onOpen: (id: string) => void
  onShowClosed: () => void
}) {
  const weekAgo = subDays(now, 7).toISOString()
  // Open: highest priority, then longest waiting. Active: closest to (or furthest past) the SLA first.
  const sortBySla = (a: Ticket, b: Ticket) => currentSla(a, now).clock.remainingMs - currentSla(b, now).clock.remainingMs
  const columns: Record<TicketStatus, Ticket[]> = {
    open: tickets.filter((t) => t.status === 'open').sort((a, b) => sortTicketsForWork(a, b) || a.createdAt.localeCompare(b.createdAt)),
    assigned: tickets.filter((t) => t.status === 'assigned').sort(sortBySla),
    in_progress: tickets.filter((t) => t.status === 'in_progress').sort(sortBySla),
    closed: tickets.filter((t) => t.status === 'closed' && (t.closedAt ?? '') >= weekAgo).sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? '')),
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[1040px] grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const list = columns[status]
          const shown = status === 'closed' ? list.slice(0, 8) : list
          return (
            <section key={status} className={clsx('flex flex-col rounded-xl border border-t-4 border-navy-100 bg-navy-100/40', COLUMN_STYLE[status])}>
              <header className="flex items-baseline justify-between px-3 pt-3 pb-2">
                <h2 className="font-semibold text-navy-900">
                  {STATUS_LABELS[status]} <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs text-navy-600">{list.length}</span>
                </h2>
                <span className="text-xs text-navy-500">{COLUMN_HINT[status]}</span>
              </header>
              <div className="flex max-h-[70vh] flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
                {shown.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-navy-200 px-3 py-6 text-center text-sm text-navy-400">Nothing here</p>
                ) : (
                  shown.map((t) => <TicketCard key={t.id} ticket={t} now={now} canAssign={canAssign} onOpen={() => onOpen(t.id)} />)
                )}
                {status === 'closed' && (
                  <button type="button" onClick={onShowClosed} className="mt-1 text-sm font-medium text-teal-700 hover:underline">
                    All closed tickets →
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/** Table view with status tabs, SLA column and quick assign. */
function TicketList({
  tickets,
  tab,
  setTab,
  now,
  canAssign,
  onOpen,
}: {
  tickets: Ticket[]
  tab: Tab
  setTab: (t: Tab) => void
  now: number
  canAssign: boolean
  onOpen: (id: string) => void
}) {
  const { rooms, technicians } = useAppState()
  const visible = tickets
    .filter((t) => tab === 'all' || t.status === tab)
    .sort(tab === 'all' || tab === 'closed' ? (a, b) => b.createdAt.localeCompare(a.createdAt) : sortTicketsForWork)
  const tabs: Tab[] = ['all', ...STATUSES]

  return (
    <Card flush>
      <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1 border-b border-navy-100 px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium', tab === t ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50')}
          >
            {t === 'all' ? 'All' : STATUS_LABELS[t]}{' '}
            <span className="ml-1 opacity-70">{t === 'all' ? tickets.length : tickets.filter((x) => x.status === t).length}</span>
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Inbox} title="No tickets match">
          Try another tab or clear the filters.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Service level</th>
                <th className="px-3 py-3">Technician</th>
                <th className="px-4 py-3">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {visible.map((t) => {
                const Icon = CATEGORY_ICONS[t.category]
                const tech = technicians.find((x) => x.id === t.assignedTechnicianId)
                return (
                  <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer hover:bg-teal-50/40">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-semibold text-navy-900">
                        <Icon className="size-4 text-navy-500" aria-hidden />
                        {t.id}
                        {t.priority === 'high' && <PriorityBadge priority="high" />}
                      </span>
                      <p className="max-w-[18rem] truncate text-xs text-navy-500">{t.description}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-navy-800">{ticketLocation(t, rooms)}</p>
                      <p className="text-xs text-navy-400">{t.roomId ?? CATEGORY_LABELS[t.category]}</p>
                    </td>
                    <td className="px-3 py-3">
                      <TicketStatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3">
                      <SlaBadge ticket={t} now={now} />
                    </td>
                    <td className="px-3 py-3">
                      {tech ? (
                        <span className="text-navy-700">{tech.name}</span>
                      ) : t.status === 'open' && canAssign ? (
                        <QuickAssign ticket={t} />
                      ) : (
                        <span className="text-navy-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-navy-600">{formatAgo(t.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/** Summary cards under the work area: categories, repeat-fault rooms, technician workload. */
function Insights({
  tickets,
  now,
  campusTechs,
  activeTech,
  category,
  onCategory,
  onTech,
  onRoom,
}: {
  tickets: Ticket[]
  now: number
  campusTechs: Array<{ id: string; name: string; trade: string }>
  activeTech: string
  category: TicketCategory | 'all'
  onCategory: (c: TicketCategory) => void
  onTech: (id: string) => void
  onRoom: (roomId: string) => void
}) {
  const { rooms } = useAppState()
  const last30 = createdSince(tickets, subDays(now, 30))
  const repeat = repeatFaultRooms(tickets, new Date(now))
  const byCategory = CATEGORIES.map((c) => ({ c, n: last30.filter((t) => t.category === c).length })).filter((x) => x.n > 0)
  const max = Math.max(1, ...byCategory.map((x) => x.n))

  return (
    <div className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy-900">
        <Gauge className="size-5 text-teal-600" aria-hidden />
        Insights
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Tickets by category" subtitle="Last 30 days · click to filter">
          <ul className="space-y-2.5">
            {byCategory.map(({ c, n }) => {
              const Icon = CATEGORY_ICONS[c]
              return (
                <li key={c}>
                  <button type="button" onClick={() => onCategory(c)} className="grid w-full grid-cols-[8rem_1fr_2rem] items-center gap-2 text-left text-sm">
                    <span className={clsx('flex items-center gap-1.5', category === c ? 'font-semibold text-teal-700' : 'text-navy-700')}>
                      <Icon className="size-4" aria-hidden />
                      {CATEGORY_LABELS[c]}
                    </span>
                    <span className="h-2 rounded-full bg-navy-50">
                      <span className="block h-2 rounded-full bg-teal-500" style={{ width: `${(n / max) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums">{n}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title="Repeat-fault rooms" subtitle="3+ tickets in 30 days · click to show">
          {repeat.length === 0 ? (
            <EmptyState icon={Repeat} title="No repeat faults" />
          ) : (
            <ul className="divide-y divide-navy-50">
              {repeat.map((r) => (
                <li key={r.roomId}>
                  <button type="button" onClick={() => onRoom(r.roomId)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-navy-50/50">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-alert-soft text-sm font-bold text-red-700">{r.count}×</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-navy-900">{rooms.find((x) => x.id === r.roomId)?.name ?? r.roomId}</span>
                      <span className="block truncate text-xs text-navy-500">
                        {r.roomId} · {r.categories.map((c) => CATEGORY_LABELS[c]).join(', ')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Technician workload" subtitle="Active jobs · click to filter">
          <ul className="divide-y divide-navy-50">
            {campusTechs.map((t) => {
              const active = tickets.filter((x) => x.assignedTechnicianId === t.id && x.status !== 'closed').length
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onTech(t.id)}
                    className={clsx('flex w-full items-center justify-between gap-3 py-2 text-left text-sm', activeTech === t.id && 'font-semibold text-teal-700')}
                  >
                    <span className="truncate">
                      {t.name} <span className="text-xs font-normal text-navy-400">· {t.trade.toUpperCase()}</span>
                    </span>
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', active ? 'bg-warn-soft text-amber-800' : 'bg-navy-50 text-navy-500')}>{active}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
