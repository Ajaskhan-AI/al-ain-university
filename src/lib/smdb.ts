import { can } from '../auth/permissions'
import type { Tone } from '../components/ui/Badge'
import { SMDBS } from '../data/smdbs'
import type { Alert, Asset, CampusFilter, PpmTask, Smdb, SmdbStatus, Ticket, User } from '../types'
import { filterByCampus } from './campus'

export const SMDB_STATUS_LABELS: Record<SmdbStatus, string> = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical',
  tripped: 'Tripped',
}

export const SMDB_STATUS_TONE: Record<SmdbStatus, Tone> = {
  normal: 'ok',
  warning: 'warn',
  critical: 'alert',
  tripped: 'alert',
}

const RANK: Record<SmdbStatus, number> = { normal: 0, warning: 1, critical: 2, tripped: 3 }

export function worstStatus(statuses: SmdbStatus[]): SmdbStatus {
  return statuses.reduce<SmdbStatus>((worst, s) => (RANK[s] > RANK[worst] ? s : worst), 'normal')
}

/**
 * Boards the user may see. Technicians ('smdb.viewAssigned') only see boards
 * linked to their open work orders or PPM tasks.
 */
export function visibleSmdbs(
  user: User | null,
  campus: CampusFilter,
  data: { tickets: Ticket[]; ppmTasks: PpmTask[]; assets: Asset[] },
): Smdb[] {
  if (can(user, 'smdb.view')) return filterByCampus(SMDBS, campus)
  if (!can(user, 'smdb.viewAssigned') || !user?.technicianId) return []
  const ids = new Set<string>()
  for (const t of data.tickets) if (t.assignedTechnicianId === user.technicianId && t.status !== 'closed' && t.smdbId) ids.add(t.smdbId)
  for (const task of data.ppmTasks) {
    if (task.assignedTechnicianId !== user.technicianId || task.completion) continue
    const smdbId = data.assets.find((a) => a.id === task.assetId)?.smdbId
    if (smdbId) ids.add(smdbId)
  }
  return SMDBS.filter((s) => ids.has(s.id))
}

/** Can this user acknowledge / note / raise a work order from this alert? */
export function alertPermissions(user: User | null, alert: Alert) {
  const act = alert.source === 'predictive' ? can(user, 'predictive.act') : can(user, 'smdb.ackAlerts')
  const workOrder = alert.source === 'predictive' ? can(user, 'predictive.act') : can(user, 'smdb.createWorkOrder')
  return { acknowledge: act, note: act, workOrder }
}
