import { format } from 'date-fns'
import { CheckCheck, ClipboardList, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { HourlyChart } from '../../components/energy/EnergyCharts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/toastContext'
import { getBuilding } from '../../data/buildings'
import { getHourlyProfile } from '../../data/energy'
import { actorFromUser } from '../../lib/actor'
import { DAY_TYPE_LABELS } from '../../lib/calendar'
import { kwhToTonnesCo2 } from '../../lib/co2'
import { fromISODate } from '../../lib/dates'
import { EXPECTED_SHARE, TARIFF_NOTE, type WasteFlag } from '../../lib/energyAnalysis'
import { formatNumber } from '../../lib/format'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'

/** Details of one flagged day: why it was flagged, the hourly profile, and what to do. */
export function FlagDetailModal({ flag, onClose }: { flag: WasteFlag; onClose: () => void }) {
  const { tickets, reviewedWasteIds, counters } = useAppState()
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const navigate = useNavigate()

  const building = getBuilding(flag.buildingId)
  const hours = getHourlyProfile({ buildingId: flag.buildingId, campus: flag.campus, date: flag.date, kWh: flag.actualKwh, peakKw: 0 })
  const night = hours.filter((_, h) => h < 6 || h >= 20).reduce((s, v) => s + v, 0)
  const nightShare = Math.round((night / flag.actualKwh) * 100)
  const reviewed = reviewedWasteIds.includes(flag.id)
  const workOrder = tickets.find((t) => t.energyFlagId === flag.id)
  const canReview = can(user, 'energy.edit') || can(user, 'tickets.create')
  const canWorkOrder = can(user, 'tickets.create')
  const dayLabel = DAY_TYPE_LABELS[flag.dayType].toLowerCase()

  const toggleReviewed = () => {
    dispatch(actions.setWasteReviewed(flag.id, !reviewed))
    toast.show(reviewed ? 'Flag reopened' : 'Marked as reviewed', 'info')
  }
  const createWorkOrder = () => {
    if (!user || !building) return
    const id = `WO-${counters.ticket}`
    dispatch(
      actions.createTicket({
        id,
        buildingId: building.id,
        campus: building.campus,
        category: 'ac',
        description: `Energy waste: ${building.name} used ${formatNumber(flag.actualKwh)} kWh on ${format(fromISODate(flag.date), 'd MMM yyyy')} (${dayLabel}), ${flag.excessPct}% above expected. Check BMS / HVAC schedules and lighting controls.`,
        priority: flag.excessPct > 60 ? 'high' : 'medium',
        source: 'energy',
        energyFlagId: flag.id,
        by: actorFromUser(user),
      }),
    )
    toast.show(`Work order ${id} created`)
    navigate(`/complaints/${id}`)
  }

  return (
    <Modal
      title={`${building?.name ?? flag.buildingId} · ${format(fromISODate(flag.date), 'EEE d MMM yyyy')}`}
      onClose={onClose}
      footer={
        <>
          {canReview && (
            <Button variant="secondary" onClick={toggleReviewed}>
              {reviewed ? <RotateCcw className="size-4" aria-hidden /> : <CheckCheck className="size-4" aria-hidden />}
              {reviewed ? 'Reopen' : 'Mark as reviewed'}
            </Button>
          )}
          {workOrder ? (
            <Link to={`/complaints/${workOrder.id}`} className="inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-teal-700 hover:underline">
              <ClipboardList className="size-4" aria-hidden />
              Work order {workOrder.id}
            </Link>
          ) : (
            canWorkOrder && (
              <Button variant="teal" onClick={createWorkOrder}>
                <ClipboardList className="size-4" aria-hidden />
                Create work order
              </Button>
            )
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="warn">{DAY_TYPE_LABELS[flag.dayType]}</Badge>
          {reviewed && <Badge tone="ok">Reviewed</Badge>}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Actual', `${formatNumber(flag.actualKwh)} kWh`],
            ['Expected', `${formatNumber(flag.expectedKwh)} kWh`],
            ['Excess', `+${formatNumber(flag.excessKwh)} kWh (${flag.excessPct}%)`],
            ['Indicative cost', `${formatNumber(flag.aed)} AED · ${formatNumber(kwhToTonnesCo2(flag.excessKwh), 2)} t CO₂`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-navy-50 p-3">
              <dt className="text-xs text-navy-500">{label}</dt>
              <dd className="font-semibold text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-navy-700">
          On a {dayLabel} this building is expected to use about {Math.round(EXPECTED_SHARE[flag.dayType] * 100)}% of a normal teaching
          day (weather-adjusted). It used {flag.excessPct}% more than that. {nightShare}% of the day’s energy was used at night (20:00–06:00).
        </p>
        <div>
          <p className="mb-1 text-sm font-semibold text-navy-800">Hourly profile (amber = night hours)</p>
          <HourlyChart hours={hours} />
        </div>
        <p className="text-xs text-navy-500">{TARIFF_NOTE} Savings are to be measured during the pilot.</p>
      </div>
    </Modal>
  )
}
