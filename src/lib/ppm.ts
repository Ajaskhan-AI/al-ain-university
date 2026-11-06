import { can } from '../auth/permissions'
import type { Tone } from '../components/ui/Badge'
import { PPM_TITLES } from '../data/ppmTasks'
import type {
  Asset,
  AssetCategory,
  CampusFilter,
  CampusId,
  ChecklistItem,
  PpmFrequency,
  PpmStatus,
  PpmTask,
  Trade,
  User,
} from '../types'

/** Status is worked out from the data, never stored, so it is always up to date. */
export function getPpmStatus(task: PpmTask, todayISO: string): PpmStatus {
  if (task.completion) return 'done'
  return task.dueDate < todayISO ? 'overdue' : 'due'
}

export const PPM_STATUS_LABELS: Record<PpmStatus, string> = { done: 'Done', due: 'Due', overdue: 'Overdue' }
export const PPM_STATUS_TONE: Record<PpmStatus, Tone> = { done: 'ok', due: 'warn', overdue: 'alert' }

export const FREQUENCIES: PpmFrequency[] = ['once', 'daily', 'weekly', 'monthly', 'quarterly']
export const FREQUENCY_LABELS: Record<PpmFrequency, string> = {
  once: 'One-off',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}

export const ASSET_CATEGORIES: AssetCategory[] = ['chiller', 'ahu', 'pump', 'generator', 'smdb']
export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  chiller: 'Chiller',
  ahu: 'AHU',
  pump: 'Pump',
  generator: 'Generator',
  smdb: 'SMDB / panel',
}

/** Which trade normally maintains each category (pumps can be changed to plumbing). */
export const DEFAULT_TRADE: Record<AssetCategory, Trade> = {
  chiller: 'hvac',
  ahu: 'hvac',
  pump: 'hvac',
  generator: 'electrical',
  smdb: 'electrical',
}

const TAG_CODES: Record<AssetCategory, string> = { chiller: 'CH', ahu: 'AHU', pump: 'PMP', generator: 'GEN', smdb: 'SMDB' }

/** Next free QR tag, e.g. AAU-AIN-AHU-06. */
export function nextAssetTag(assets: Asset[], campus: CampusId, category: AssetCategory): string {
  const prefix = `AAU-${campus}-${TAG_CODES[category]}-`
  const highest = assets
    .filter((a) => a.id.startsWith(prefix))
    .reduce((max, a) => Math.max(max, Number(a.id.slice(prefix.length)) || 0), 0)
  return `${prefix}${String(highest + 1).padStart(2, '0')}`
}

export function defaultTaskTitle(category: AssetCategory, frequency: PpmFrequency): string {
  return PPM_TITLES[category][frequency] ?? `${FREQUENCY_LABELS[frequency]} ${ASSET_CATEGORY_LABELS[category]} service`
}

export function formatPpmId(n: number): string {
  return `PPM-${String(n).padStart(4, '0')}`
}

export interface PpmSummary {
  /** Tasks that should be done by now (due today or earlier), plus any done early. */
  scheduled: number
  done: number
  due: number
  overdue: number
  /** done ÷ scheduled, rounded; null when nothing is scheduled yet. */
  pct: number | null
}

/**
 * PPM completion for tasks due between `from` and `to` (inclusive ISO dates).
 * Future tasks don't count against the % until their due date arrives.
 */
export function summarizePpm(tasks: PpmTask[], todayISO: string, from = '0000-01-01', to = '9999-12-31'): PpmSummary {
  const inPeriod = tasks.filter((t) => t.dueDate >= from && t.dueDate <= to)
  let done = 0
  let due = 0
  let overdue = 0
  let scheduled = 0
  for (const task of inPeriod) {
    const status = getPpmStatus(task, todayISO)
    if (status === 'done') done++
    else if (status === 'overdue') overdue++
    else due++
    if (status === 'done' || task.dueDate <= todayISO) scheduled++
  }
  return { scheduled, done, due, overdue, pct: scheduled ? Math.round((done / scheduled) * 100) : null }
}

/**
 * Tasks the user may see: within the campus filter, and — for technicians
 * (who only have 'ppm.viewOwn') — only their own.
 */
export function visiblePpmTasks(tasks: PpmTask[], assets: Asset[], campus: CampusFilter, user: User | null): PpmTask[] {
  const campusOf = new Map(assets.map((a) => [a.id, a.campus]))
  const onlyOwn = !can(user, 'ppm.view')
  return tasks.filter((task) => {
    const assetCampus = campusOf.get(task.assetId)
    if (!assetCampus || (campus !== 'ALL' && assetCampus !== campus)) return false
    return !onlyOwn || isTaskMine(user, task)
  })
}

/** Can this user fill in and submit the task's checklist? */
export function canCompletePpm(user: User | null, task: PpmTask): boolean {
  if (task.completion) return false
  return can(user, 'ppm.complete') || (can(user, 'ppm.completeOwn') && isTaskMine(user, task))
}

/** Is this task assigned to the logged-in technician? */
export function isTaskMine(user: User | null, task: PpmTask): boolean {
  return !!user?.technicianId && task.assignedTechnicianId === user.technicianId
}

/** True when a reading is outside its normal range (shown amber, needs a remark). */
export function isReadingOutOfRange(item: ChecklistItem, value: unknown): boolean {
  return item.kind === 'reading' && typeof value === 'number' && (value < item.min || value > item.max)
}
