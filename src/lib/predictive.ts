import { addDays } from 'date-fns'
import type { Tone } from '../components/ui/Badge'
import type { Assessment, HealthStatus } from '../sim/predictiveModel'
import type { NewPpmTaskInput, NewTicketInput } from '../store/actions'
import type { Actor, Asset, Technician, TicketCategory } from '../types'
import { toISODate } from './dates'

export const HEALTH_TONE: Record<HealthStatus, Tone> = { ok: 'ok', watch: 'warn', alert: 'alert' }

const TRADE_CATEGORY: Record<Asset['trade'], TicketCategory> = {
  hvac: 'ac',
  electrical: 'electrical',
  plumbing: 'plumbing',
  general: 'other',
}

/** "Create work order" from a predictive finding. */
export function predictiveWorkOrder(asset: Asset, a: Assessment, id: string, by: Actor): NewTicketInput {
  const issue = a.issue
  return {
    id,
    buildingId: asset.buildingId,
    campus: asset.campus,
    assetId: asset.id,
    category: TRADE_CATEGORY[asset.trade],
    description: issue
      ? `${issue.title} on ${asset.name} (health ${a.health}/100). Recommended: ${issue.action}`
      : `Condition check on ${asset.name} (health ${a.health}/100).`,
    priority: a.status === 'alert' ? 'high' : 'medium',
    source: 'predictive',
    by,
  }
}

/** "Schedule maintenance": a one-off PPM task, due within a week (sooner if the asset is close to failing). */
export function predictivePpmTask(asset: Asset, a: Assessment, technicians: Technician[], id: string, by: Actor): NewPpmTaskInput {
  const days = Math.max(1, Math.min(7, a.daysToAction ?? 7))
  const tech = technicians.find((t) => t.campus === asset.campus && t.trade === asset.trade && t.active)
  return {
    id,
    assetId: asset.id,
    title: `Predictive: ${a.issue?.shortAction ?? 'condition check'}`,
    frequency: 'once',
    dueDate: toISODate(addDays(new Date(), days)),
    ...(tech ? { assignedTechnicianId: tech.id } : {}),
    source: 'predictive',
    by,
  }
}
