import { format } from 'date-fns'
import { ArrowLeft, Boxes, CircleCheck, Gauge, History, MapPin, Plus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { AddTaskModal } from '../../components/ppm/AddTaskModal'
import { ASSET_ICONS } from '../../components/ppm/assetIcons'
import { PpmTaskList } from '../../components/ppm/PpmTaskList'
import { TicketStatusBadge } from '../../components/tickets/TicketBadges'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/toastContext'
import { getBuilding } from '../../data/buildings'
import { CHECKLIST_TEMPLATES } from '../../data/checklists'
import { toISODate } from '../../lib/dates'
import { ASSET_CATEGORY_LABELS, FREQUENCY_LABELS, getPpmStatus } from '../../lib/ppm'
import { useAppState } from '../../store/hooks'
import AccessRestrictedPage from '../AccessRestrictedPage'

/** What a QR tag opens: asset details, its checklist, open tasks and the full maintenance log. */
export default function AssetPage() {
  const { assetId } = useParams()
  const { assets, ppmTasks, tickets } = useAppState()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()
  const [showAddTask, setShowAddTask] = useState(false)

  const asset = assets.find((a) => a.id === assetId)
  if (!user) return null
  if (!asset) {
    return (
      <EmptyState icon={Boxes} title={`Asset ${assetId} not found`}>
        <Link to="/ppm/scan" className="text-teal-700 underline">
          Scan or pick another asset
        </Link>
      </EmptyState>
    )
  }
  if (user.campus !== 'ALL' && asset.campus !== user.campus) return <AccessRestrictedPage />

  const today = toISODate(new Date())
  const building = getBuilding(asset.buildingId)
  const Icon = ASSET_ICONS[asset.category]
  const tasks = ppmTasks.filter((t) => t.assetId === asset.id)
  const open = tasks
    .filter((t) => !t.completion)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const history = tasks
    .filter((t) => t.completion)
    .sort((a, b) => (b.completion?.at ?? '').localeCompare(a.completion?.at ?? ''))
  const workOrders = tickets.filter((t) => t.assetId === asset.id || (asset.smdbId && t.smdbId === asset.smdbId))
  const overdue = open.filter((t) => getPpmStatus(t, today) === 'overdue').length
  const qrValue = `${window.location.origin}${window.location.pathname}#/ppm/assets/${asset.id}`

  return (
    <>
      <Link to="/ppm?tab=assets" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft className="size-4" aria-hidden />
        All assets
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
            <Icon className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{asset.name}</h1>
            <p className="font-mono text-sm font-semibold text-teal-700">{asset.id}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-navy-600">
              <MapPin className="size-4" aria-hidden />
              {building?.name} · {asset.location}
              <Badge>{ASSET_CATEGORY_LABELS[asset.category]}</Badge>
              {asset.monitored && <Badge tone="info">CT monitored — Predictive Maintenance</Badge>}
              {overdue > 0 && <Badge tone="alert">{overdue} overdue</Badge>}
            </p>
          </div>
        </div>
        {can(user, 'ppm.manage') && (
          <Button variant="teal" onClick={() => setShowAddTask(true)}>
            <Plus className="size-4" aria-hidden />
            Add PPM task
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Open PPM tasks" subtitle="Tap a task to open its checklist">
            {open.length ? <PpmTaskList tasks={open} today={today} showAsset={false} /> : <EmptyState icon={CircleCheck} title="Nothing open — all PPM is up to date" />}
          </Card>

          <Card title="Maintenance history" subtitle="Digital logbook: every completed checklist, newest first" flush>
            {history.length === 0 ? (
              <EmptyState icon={History} title="No completed PPM yet" />
            ) : (
              <ul className="divide-y divide-navy-50">
                {history.map((t) => (
                  <li key={t.id}>
                    <Link to={`/ppm/tasks/${t.id}`} className="block px-5 py-3 hover:bg-navy-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-navy-900">
                          {t.title} <span className="text-xs font-normal text-navy-400">· {FREQUENCY_LABELS[t.frequency]} · {t.id}</span>
                        </p>
                        <p className="text-sm text-navy-500">{t.completion && format(new Date(t.completion.at), 'd MMM yyyy, HH:mm')}</p>
                      </div>
                      <p className="text-sm text-navy-600">
                        By {t.completion?.technicianName}
                        {t.completion?.remarks && <> — “{t.completion.remarks}”</>}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {workOrders.length > 0 && (
            <Card title="Related work orders" flush>
              <ul className="divide-y divide-navy-50">
                {workOrders.map((t) => (
                  <li key={t.id}>
                    <Link to={`/complaints/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-navy-50/50">
                      <span className="min-w-0">
                        <span className="font-semibold text-navy-900">{t.id}</span>{' '}
                        <span className="text-sm text-navy-600">{t.description}</span>
                      </span>
                      <TicketStatusBadge status={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Asset QR tag">
            <div className="flex flex-col items-center text-center">
              <QRCodeSVG value={qrValue} size={150} level="M" marginSize={1} />
              <p className="mt-2 font-mono text-sm font-semibold text-navy-900">{asset.id}</p>
              <p className="text-xs text-navy-500">Scanning this tag opens this page</p>
            </div>
          </Card>

          <Card title="Details">
            <dl className="space-y-2 text-sm">
              {[
                ['Description', asset.description],
                ['Installed', String(asset.installYear)],
                ['Maintained by', `${asset.trade.toUpperCase()} team`],
                ['Campus', asset.campus === 'AIN' ? 'Al Ain' : 'Abu Dhabi'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-navy-500">{label}</dt>
                  <dd className="text-right font-medium text-navy-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Checklist template">
            <ul className="space-y-1.5 text-sm text-navy-700">
              {CHECKLIST_TEMPLATES[asset.category].map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  {item.kind === 'check' ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden />
                  ) : (
                    <Gauge className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden />
                  )}
                  <span>
                    {item.label}
                    {item.kind === 'reading' && (
                      <span className="text-navy-400">
                        {' '}
                        ({item.min}–{item.max} {item.unit})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {showAddTask && (
        <AddTaskModal
          assetId={asset.id}
          onClose={() => setShowAddTask(false)}
          onCreated={(id) => {
            setShowAddTask(false)
            toast.show(`PPM task ${id} added`)
            navigate(`/ppm/tasks/${id}`)
          }}
        />
      )}
    </>
  )
}
