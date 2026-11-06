import { subDays } from 'date-fns'
import clsx from 'clsx'
import { CircleCheck, Clock, Inbox, Plus, QrCode, Repeat, Search, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CATEGORY_ICONS } from '../../components/tickets/categoryIcons'
import { NewTicketModal } from '../../components/tickets/NewTicketModal'
import { PriorityBadge, TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClass, inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { BUILDINGS } from '../../data/buildings'
import { filterByCampus } from '../../lib/campus'
import { formatAgo, formatDuration } from '../../lib/format'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  average,
  createdSince,
  repeatFaultRooms,
  resolutionMs,
  responseMs,
  sortTicketsForWork,
  ticketLocation,
} from '../../lib/tickets'
import { useAppState } from '../../store/hooks'
import type { Ticket, TicketCategory } from '../../types'

type Tab = 'inbox' | 'active' | 'closed' | 'all'

const TABS: Array<{ id: Tab; label: string; match: (t: Ticket) => boolean }> = [
  { id: 'inbox', label: 'Inbox (new)', match: (t) => t.status === 'open' },
  { id: 'active', label: 'In work', match: (t) => t.status === 'assigned' || t.status === 'in_progress' },
  { id: 'closed', label: 'Closed', match: (t) => t.status === 'closed' },
  { id: 'all', label: 'All', match: () => true },
]

export default function ComplaintsPage() {
  const { tickets, rooms, technicians, campus } = useAppState()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>(user?.role === 'helpdesk' ? 'inbox' : 'all')
  const [category, setCategory] = useState<TicketCategory | 'all'>('all')
  const [buildingId, setBuildingId] = useState('all')
  const [techId, setTechId] = useState('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const now = new Date()
  const scoped = filterByCampus(tickets, campus)
  const last30 = createdSince(scoped, subDays(now, 30))
  const repeatRooms = repeatFaultRooms(scoped, now)
  const campusBuildings = filterByCampus(BUILDINGS, campus)
  const campusTechs = filterByCampus(technicians, campus)

  // Ignore a building/technician filter that belongs to the other campus.
  const activeBuilding = campusBuildings.some((b) => b.id === buildingId) ? buildingId : 'all'
  const activeTech = campusTechs.some((t) => t.id === techId) ? techId : 'all'

  const query = search.trim().toLowerCase()
  const tabMatch = TABS.find((t) => t.id === tab)?.match ?? (() => true)
  const baseFiltered = scoped.filter(
    (t) =>
      (category === 'all' || t.category === category) &&
      (activeBuilding === 'all' || t.buildingId === activeBuilding) &&
      (activeTech === 'all' || t.assignedTechnicianId === activeTech) &&
      (!query ||
        [t.id, t.roomId ?? '', t.description, t.requesterName ?? '', ticketLocation(t, rooms)].some((field) =>
          field.toLowerCase().includes(query),
        )),
  )
  const visible = baseFiltered
    .filter(tabMatch)
    .sort(tab === 'closed' || tab === 'all' ? (a, b) => b.createdAt.localeCompare(a.createdAt) : sortTicketsForWork)

  const openCount = scoped.filter((t) => t.status !== 'closed').length
  const unassigned = scoped.filter((t) => t.status === 'open').length
  const byCategory = CATEGORIES.map((c) => ({ category: c, count: last30.filter((t) => t.category === c).length }))
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.count))

  const techName = (id?: string) => technicians.find((t) => t.id === id)?.name

  return (
    <>
      <PageHeader
        title="Complaints & Work Orders"
        description="From a room QR code to a closed work order — with response and resolution times."
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

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open tickets" value={openCount} sub={`${unassigned} waiting for assignment`} icon={Inbox} tone={unassigned ? 'alert' : 'ok'} />
        <KpiCard label="Avg response time" value={formatDuration(average(last30.map(responseMs)))} sub="Reported → assigned, last 30 days" icon={Timer} tone="info" />
        <KpiCard label="Avg resolution time" value={formatDuration(average(last30.map(resolutionMs)))} sub="Reported → closed, last 30 days" icon={Clock} tone="info" />
        <KpiCard label="Closed (30 days)" value={last30.filter((t) => t.status === 'closed').length} sub={`of ${last30.length} reported`} icon={CircleCheck} tone="ok" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Tickets by category" subtitle="Last 30 days">
          <ul className="space-y-3">
            {byCategory.map(({ category: c, count }) => {
              const Icon = CATEGORY_ICONS[c]
              return (
                <li key={c}>
                  <button type="button" onClick={() => setCategory(category === c ? 'all' : c)} className="w-full text-left">
                    <div className="flex items-center justify-between text-sm">
                      <span className={clsx('flex items-center gap-2', category === c ? 'font-semibold text-teal-700' : 'text-navy-700')}>
                        <Icon className="size-4" aria-hidden />
                        {CATEGORY_LABELS[c]}
                      </span>
                      <span className="font-semibold tabular-nums text-navy-900">{count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-navy-50">
                      <div className="h-2 rounded-full bg-teal-500" style={{ width: `${(count / maxCategory) * 100}%` }} />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title="Repeat-fault rooms" subtitle="3+ tickets in the last 30 days">
          {repeatRooms.length === 0 ? (
            <EmptyState icon={Repeat} title="No repeat faults" />
          ) : (
            <ul className="divide-y divide-navy-50">
              {repeatRooms.map((r) => {
                const room = rooms.find((x) => x.id === r.roomId)
                return (
                  <li key={r.roomId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch(r.roomId)
                        setTab('all')
                      }}
                      className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-navy-50/50"
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-alert-soft text-sm font-bold text-red-700">
                        {r.count}×
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-navy-900">{room?.name ?? r.roomId}</span>
                        <span className="block truncate text-xs text-navy-500">
                          {r.roomId} · {r.categories.map((c) => CATEGORY_LABELS[c]).join(', ')}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title="Technician workload" subtitle="Active jobs · click to filter">
          <ul className="divide-y divide-navy-50">
            {campusTechs.map((t) => {
              const active = scoped.filter((x) => x.assignedTechnicianId === t.id && x.status !== 'closed').length
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTechId(activeTech === t.id ? 'all' : t.id)}
                    className={clsx(
                      'flex w-full items-center justify-between gap-3 py-2 text-left text-sm',
                      activeTech === t.id && 'font-semibold text-teal-700',
                    )}
                  >
                    <span className="truncate">
                      {t.name} <span className="text-xs font-normal text-navy-400">· {t.trade.toUpperCase()}</span>
                    </span>
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', active ? 'bg-warn-soft text-amber-800' : 'bg-navy-50 text-navy-500')}>
                      {active}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {/* Ticket list */}
      <Card className="mt-6" flush>
        <div className="space-y-3 border-b border-navy-100 px-5 py-4">
          <div role="tablist" aria-label="Ticket status" className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const count = baseFiltered.filter(t.match).length
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-sm font-medium',
                    tab === t.id ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50',
                  )}
                >
                  {t.label} <span className="ml-1 opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="relative">
              <span className="sr-only">Search tickets</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-400" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, room, text…"
                className={clsx(inputClass, 'pl-9')}
              />
            </label>
            <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory | 'all')} className={inputClass}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <select aria-label="Building" value={activeBuilding} onChange={(e) => setBuildingId(e.target.value)} className={inputClass}>
              <option value="all">All buildings</option>
              {campusBuildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select aria-label="Technician" value={activeTech} onChange={(e) => setTechId(e.target.value)} className={inputClass}>
              <option value="all">All technicians</option>
              {campusTechs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={Inbox} title="No tickets match">
            Try another tab or clear the filters.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Technician</th>
                  <th className="px-3 py-3">Reported</th>
                  <th className="px-5 py-3 text-right">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {visible.map((t) => {
                  const Icon = CATEGORY_ICONS[t.category]
                  return (
                    <tr key={t.id} onClick={() => navigate(`/complaints/${t.id}`)} className="cursor-pointer hover:bg-teal-50/40">
                      <td className="px-5 py-3">
                        <Link to={`/complaints/${t.id}`} className="font-semibold text-navy-900 hover:text-teal-700" onClick={(e) => e.stopPropagation()}>
                          {t.id}
                        </Link>
                        <p className="max-w-[16rem] truncate text-xs text-navy-500">{t.description}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-navy-800">{ticketLocation(t, rooms)}</p>
                        <p className="text-xs text-navy-400">{t.roomId}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5 text-navy-700">
                          <Icon className="size-4" aria-hidden />
                          {CATEGORY_LABELS[t.category]}
                        </span>
                        {t.priority === 'high' && <PriorityBadge priority="high" />}
                      </td>
                      <td className="px-3 py-3">
                        <TicketStatusBadge status={t.status} />
                      </td>
                      <td className="px-3 py-3 text-navy-700">{techName(t.assignedTechnicianId) ?? <span className="text-navy-400">Unassigned</span>}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-navy-600">{formatAgo(t.createdAt)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap tabular-nums text-navy-700">
                        {t.assignedAt ? formatDuration(responseMs(t)) : <span className="text-red-600">waiting</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false)
            toast.show(`Ticket ${id} created`)
            navigate(`/complaints/${id}`)
          }}
        />
      )}
    </>
  )
}
