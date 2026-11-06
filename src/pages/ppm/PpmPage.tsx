import clsx from 'clsx'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { Boxes, CalendarCheck, CalendarClock, CalendarDays, CircleAlert, ListChecks, Percent, Plus, ScanQrCode, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { AddAssetModal } from '../../components/ppm/AddAssetModal'
import { AddTaskModal } from '../../components/ppm/AddTaskModal'
import { ASSET_ICONS } from '../../components/ppm/assetIcons'
import { PpmCalendar } from '../../components/ppm/PpmCalendar'
import { PpmStatusBadge, PpmTaskList } from '../../components/ppm/PpmTaskList'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { buttonClass, inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { BUILDINGS, getBuilding } from '../../data/buildings'
import { filterByCampus } from '../../lib/campus'
import { fromISODate, toISODate } from '../../lib/dates'
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABELS,
  FREQUENCY_LABELS,
  getPpmStatus,
  summarizePpm,
  visiblePpmTasks,
} from '../../lib/ppm'
import { useAppState } from '../../store/hooks'
import type { AssetCategory, PpmStatus } from '../../types'

type Tab = 'calendar' | 'tasks' | 'assets'
const TABS: Array<{ id: Tab; label: string; icon: typeof CalendarDays }> = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'assets', label: 'Assets', icon: Boxes },
]
const STATUSES: PpmStatus[] = ['overdue', 'due', 'done']

export default function PpmPage() {
  const { assets, ppmTasks, technicians, campus } = useAppState()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()

  // Tab and status live in the URL, so other pages can link to e.g. ?tab=tasks&status=overdue
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.some((t) => t.id === params.get('tab')) ? (params.get('tab') as Tab) : 'calendar'
  const status = (STATUSES as string[]).includes(params.get('status') ?? '') ? (params.get('status') as PpmStatus) : 'all'
  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )

  const [buildingId, setBuildingId] = useState('all')
  const [category, setCategory] = useState<AssetCategory | 'all'>('all')
  const [techId, setTechId] = useState('all')
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [modal, setModal] = useState<'asset' | 'task' | null>(null)

  const now = new Date()
  const today = toISODate(now)
  const campusBuildings = filterByCampus(BUILDINGS, campus)
  const campusTechs = filterByCampus(technicians, campus)
  const activeBuilding = campusBuildings.some((b) => b.id === buildingId) ? buildingId : 'all'
  const activeTech = campusTechs.some((t) => t.id === techId) ? techId : 'all'
  const showTechFilter = can(user, 'ppm.view') // technicians only see their own tasks anyway
  const assetById = new Map(assets.map((a) => [a.id, a]))
  const query = search.trim().toLowerCase()

  const visible = visiblePpmTasks(ppmTasks, assets, campus, user)
  const thisMonth = summarizePpm(visible, today, toISODate(startOfMonth(now)), toISODate(endOfMonth(now)))
  const lastMonthStart = subMonths(startOfMonth(now), 1)
  const lastMonth = summarizePpm(visible, today, toISODate(lastMonthStart), toISODate(endOfMonth(lastMonthStart)))
  const overdueAll = visible.filter((t) => getPpmStatus(t, today) === 'overdue').length

  const tasks = visible
    .filter((t) => {
      const asset = assetById.get(t.assetId)
      if (!asset) return false
      return (
        (activeBuilding === 'all' || asset.buildingId === activeBuilding) &&
        (category === 'all' || asset.category === category) &&
        (status === 'all' || getPpmStatus(t, today) === status) &&
        (activeTech === 'all' || t.assignedTechnicianId === activeTech) &&
        (!query || [t.id, t.title, asset.id, asset.name].some((f) => f.toLowerCase().includes(query)))
      )
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const campusAssets = filterByCampus(assets, campus).filter(
    (a) =>
      (activeBuilding === 'all' || a.buildingId === activeBuilding) &&
      (category === 'all' || a.category === category) &&
      (!query || [a.id, a.name, a.location].some((f) => f.toLowerCase().includes(query))),
  )

  const dayTasks = selectedDay ? tasks.filter((t) => t.dueDate === selectedDay) : []
  const techName = (id?: string) => technicians.find((t) => t.id === id)?.name ?? '—'

  return (
    <>
      <PageHeader
        title="Digital Logbook & PPM"
        description="Planned preventive maintenance with QR-tagged assets, digital checklists and a full history per asset."
        actions={
          <>
            <Link to="/ppm/scan" className={buttonClass('secondary')}>
              <ScanQrCode className="size-4" aria-hidden />
              Scan QR
            </Link>
            {can(user, 'ppm.manage') && (
              <>
                <Button variant="secondary" onClick={() => setModal('asset')}>
                  <Plus className="size-4" aria-hidden />
                  Add asset
                </Button>
                <Button variant="teal" onClick={() => setModal('task')}>
                  <Plus className="size-4" aria-hidden />
                  Add PPM task
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`PPM completion — ${format(now, 'MMMM')}`}
          value={thisMonth.pct === null ? '—' : `${thisMonth.pct}%`}
          sub={`${thisMonth.done} of ${thisMonth.scheduled} due to date · ${format(lastMonthStart, 'MMM')}: ${lastMonth.pct ?? '—'}%`}
          icon={Percent}
          tone={thisMonth.pct === null ? 'neutral' : thisMonth.pct >= 85 ? 'ok' : thisMonth.pct >= 60 ? 'warn' : 'alert'}
        />
        <KpiCard label="Done this month" value={thisMonth.done} sub="Checklists submitted" icon={CalendarCheck} tone="ok" />
        <KpiCard label="Still due this month" value={thisMonth.due} sub="Scheduled, not yet late" icon={CalendarClock} tone="warn" />
        <KpiCard
          label="Overdue"
          value={overdueAll}
          sub="Past due date, not done — click to list"
          icon={CircleAlert}
          tone={overdueAll ? 'alert' : 'ok'}
          to="/ppm?tab=tasks&status=overdue"
        />
      </div>

      <Card className="mt-6" flush>
        <div className="space-y-3 border-b border-navy-100 px-5 py-4">
          <div role="tablist" aria-label="PPM views" className="flex flex-wrap gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setParam('tab', id)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
                  tab === id ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <label className="relative">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-400" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tag, asset, task…"
                className={clsx(inputClass, 'pl-9')}
              />
            </label>
            <select aria-label="Building" value={activeBuilding} onChange={(e) => setBuildingId(e.target.value)} className={inputClass}>
              <option value="all">All buildings</option>
              {campusBuildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory | 'all')} className={inputClass}>
              <option value="all">All categories</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ASSET_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            {tab !== 'assets' && (
              <select aria-label="Status" value={status} onChange={(e) => setParam('status', e.target.value === 'all' ? null : e.target.value)} className={inputClass}>
                <option value="all">All statuses</option>
                <option value="overdue">Overdue</option>
                <option value="due">Due</option>
                <option value="done">Done</option>
              </select>
            )}
            {tab !== 'assets' && showTechFilter && (
              <select aria-label="Technician" value={activeTech} onChange={(e) => setTechId(e.target.value)} className={inputClass}>
                <option value="all">All technicians</option>
                {campusTechs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {tab === 'calendar' && (
          <div className="p-5">
            <PpmCalendar
              month={month}
              onMonthChange={(m) => {
                setMonth(m)
                setSelectedDay(null)
              }}
              tasks={tasks}
              assets={assets}
              today={today}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <div className="mt-5">
              {selectedDay ? (
                <>
                  <h3 className="mb-2 font-semibold text-navy-900">
                    {format(fromISODate(selectedDay), 'EEEE d MMMM')} · {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                  </h3>
                  {dayTasks.length ? <PpmTaskList tasks={dayTasks} today={today} /> : <p className="text-sm text-navy-500">No tasks on this day.</p>}
                </>
              ) : (
                <p className="text-sm text-navy-500">Click a day to see its tasks.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'tasks' &&
          (tasks.length === 0 ? (
            <EmptyState icon={ListChecks} title="No tasks match the filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Task</th>
                    <th className="px-3 py-3">Asset</th>
                    <th className="px-3 py-3">Frequency</th>
                    <th className="px-3 py-3">Due</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Technician</th>
                    <th className="px-5 py-3">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {tasks.map((t) => {
                    const asset = assetById.get(t.assetId)
                    const s = getPpmStatus(t, today)
                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/ppm/tasks/${t.id}`)}
                        className={clsx('cursor-pointer', s === 'overdue' ? 'bg-red-50/70 hover:bg-red-50' : 'hover:bg-teal-50/40')}
                      >
                        <td className="px-5 py-3">
                          <Link to={`/ppm/tasks/${t.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-navy-900 hover:text-teal-700">
                            {t.title}
                          </Link>
                          <p className="text-xs text-navy-400">{t.id}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-navy-800">{asset?.name}</p>
                          <p className="font-mono text-xs text-navy-400">{asset?.id}</p>
                        </td>
                        <td className="px-3 py-3 text-navy-600">{FREQUENCY_LABELS[t.frequency]}</td>
                        <td className={clsx('px-3 py-3 whitespace-nowrap', s === 'overdue' ? 'font-semibold text-red-700' : 'text-navy-700')}>
                          {format(fromISODate(t.dueDate), 'd MMM yyyy')}
                        </td>
                        <td className="px-3 py-3">
                          <PpmStatusBadge status={s} />
                        </td>
                        <td className="px-3 py-3 text-navy-700">{techName(t.assignedTechnicianId)}</td>
                        <td className="px-5 py-3 text-navy-600">
                          {t.completion ? `${format(new Date(t.completion.at), 'd MMM, HH:mm')} · ${t.completion.technicianName}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}

        {tab === 'assets' &&
          (campusAssets.length === 0 ? (
            <EmptyState icon={Boxes} title="No assets match the filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">QR tag / asset</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Open PPM</th>
                    <th className="px-5 py-3">Last PPM done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {campusAssets.map((a) => {
                    const Icon = ASSET_ICONS[a.category]
                    const assetTasks = ppmTasks.filter((t) => t.assetId === a.id)
                    const overdue = assetTasks.filter((t) => getPpmStatus(t, today) === 'overdue').length
                    const due = assetTasks.filter((t) => getPpmStatus(t, today) === 'due').length
                    const lastDone = assetTasks
                      .filter((t) => t.completion)
                      .sort((x, y) => (y.completion?.at ?? '').localeCompare(x.completion?.at ?? ''))[0]
                    return (
                      <tr key={a.id} onClick={() => navigate(`/ppm/assets/${a.id}`)} className="cursor-pointer hover:bg-teal-50/40">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                              <Icon className="size-5" aria-hidden />
                            </span>
                            <span>
                              <Link to={`/ppm/assets/${a.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-navy-900 hover:text-teal-700">
                                {a.name}
                              </Link>
                              <span className="block font-mono text-xs text-navy-400">{a.id}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-navy-700">
                          {ASSET_CATEGORY_LABELS[a.category]}
                          {a.monitored && <Badge tone="info" className="ml-2">CT monitored</Badge>}
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-navy-800">{getBuilding(a.buildingId)?.shortName}</p>
                          <p className="text-xs text-navy-400">{a.location}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex flex-wrap gap-1">
                            {overdue > 0 && <Badge tone="alert">{overdue} overdue</Badge>}
                            {due > 0 && <Badge tone="warn">{due} due</Badge>}
                            {overdue + due === 0 && <span className="text-navy-400">—</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-navy-600">
                          {lastDone?.completion ? format(new Date(lastDone.completion.at), 'd MMM yyyy') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
      </Card>

      {modal === 'asset' && (
        <AddAssetModal
          onClose={() => setModal(null)}
          onCreated={(id) => {
            setModal(null)
            toast.show(`Asset ${id} added`)
            navigate(`/ppm/assets/${id}`)
          }}
        />
      )}
      {modal === 'task' && (
        <AddTaskModal
          onClose={() => setModal(null)}
          onCreated={(id) => {
            setModal(null)
            toast.show(`PPM task ${id} added`)
            navigate(`/ppm/tasks/${id}`)
          }}
        />
      )}
    </>
  )
}
