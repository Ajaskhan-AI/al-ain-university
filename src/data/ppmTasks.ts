import { addDays, addMinutes, setDate, startOfMonth, subMonths } from 'date-fns'
import { atTime, toISODate } from '../lib/dates'
import type { Rng } from '../sim/rng'
import type {
  Actor,
  Asset,
  AssetCategory,
  ChecklistResult,
  PpmCompletion,
  PpmFrequency,
  PpmTask,
  Technician,
  User,
} from '../types'
import { CHECKLIST_TEMPLATES } from './checklists'

const TITLES: Record<AssetCategory, Partial<Record<PpmFrequency, string>>> = {
  chiller: { daily: 'Daily chiller log sheet', monthly: 'Monthly chiller service', quarterly: 'Quarterly chiller inspection' },
  ahu: { monthly: 'Monthly AHU service' },
  pump: { monthly: 'Monthly pump inspection' },
  generator: { monthly: 'Monthly generator test run' },
  smdb: { monthly: 'Monthly SMDB visual check', quarterly: 'Quarterly SMDB thermal & torque check' },
}

const GOOD_REMARKS = ['All normal.', 'All parameters within range.', 'No issues found.', 'Area cleaned after work.']
const ISSUE_REMARKS: Record<AssetCategory, string[]> = {
  chiller: ['Minor oil stain near compressor — cleaned, monitor.', 'Condenser tubes due for cleaning next quarter.'],
  ahu: ['Filters heavily loaded — replaced.', 'Belt worn — adjusted, replacement ordered.'],
  pump: ['Slight seal weep — monitor.', 'Minor vibration noted — check alignment next visit.'],
  generator: ['Battery terminals cleaned.', 'Fuel top-up requested.'],
  smdb: ['Loose terminal on outgoing feeder — re-torqued.', 'Dust inside panel — cleaned.'],
}

export const SCHEDULER_ACTOR: Actor = { name: 'PPM scheduler', role: 'system' }

export function technicianActor(tech: Technician, users: User[]): Actor {
  const user = users.find((u) => u.technicianId === tech.id)
  return { name: tech.name, role: 'technician', ...(user ? { userId: user.id } : {}) }
}

function fillChecklist(category: AssetCategory, rng: Rng): { results: ChecklistResult; remarks: string } {
  const results: ChecklistResult = {}
  let hadIssue = false
  for (const item of CHECKLIST_TEMPLATES[category]) {
    if (item.kind === 'check') {
      const ok = rng.chance(0.92)
      if (!ok) hadIssue = true
      results[item.id] = ok
    } else {
      results[item.id] = Math.round(rng.range(item.min, item.max) * 10) / 10
    }
  }
  const remarks = hadIssue ? rng.pick(ISSUE_REMARKS[category]) : rng.pick(GOOD_REMARKS)
  return { results, remarks }
}

interface Input {
  assets: Asset[]
  technicians: Technician[]
  users: User[]
  now: Date
  rng: Rng
}

/**
 * ~60 tasks over last month + this month:
 * monthly service for every asset (×2 months), quarterly for chillers and SMDBs,
 * and today's daily log for chillers. Past tasks are mostly done; the rest are overdue.
 */
export function generatePpmTasks({ assets, technicians, users, now, rng }: Input): PpmTask[] {
  const today = toISODate(now)
  const thisMonth = startOfMonth(now)
  const lastMonth = subMonths(thisMonth, 1)
  const createdAt = atTime(lastMonth, 8).toISOString()
  const drafts: Omit<PpmTask, 'id'>[] = []

  const add = (asset: Asset, frequency: PpmFrequency, due: Date, doneChance: number) => {
    const tech = technicians.find((t) => t.campus === asset.campus && t.trade === asset.trade)
    const dueDate = toISODate(due)
    let completion: PpmCompletion | undefined

    const isPastOrToday = dueDate <= today
    if (tech && isPastOrToday && rng.chance(doneChance)) {
      let at = addMinutes(atTime(due, rng.int(8, 14)), rng.int(0, 59))
      if (dueDate < today) at = addDays(at, rng.int(0, 2))
      if (at > now) at = addMinutes(now, -rng.int(20, 90))
      const { results, remarks } = fillChecklist(asset.category, rng)
      completion = {
        by: technicianActor(tech, users),
        at: at.toISOString(),
        technicianName: tech.name,
        results,
        remarks,
      }
    }

    drafts.push({
      assetId: asset.id,
      title: TITLES[asset.category][frequency] ?? `${frequency} service`,
      frequency,
      dueDate,
      ...(tech ? { assignedTechnicianId: tech.id } : {}),
      source: 'plan',
      createdAt,
      createdBy: SCHEDULER_ACTOR,
      ...(completion ? { completion } : {}),
    })
  }

  assets.forEach((asset, index) => {
    const day = 3 + ((index * 7) % 24) // spread due dates over days 3–26
    add(asset, 'monthly', setDate(lastMonth, day), 0.85)
    add(asset, 'monthly', setDate(thisMonth, day), 0.6)
    if (asset.category === 'chiller' || asset.category === 'smdb') {
      add(asset, 'quarterly', setDate(thisMonth, 2 + ((index * 3) % 26)), 0.6)
    }
    if (asset.category === 'chiller') {
      add(asset, 'daily', now, 0.5)
    }
  })

  drafts.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.assetId.localeCompare(b.assetId))
  return drafts.map((draft, i) => ({ id: `PPM-${String(i + 1).padStart(4, '0')}`, ...draft }))
}
