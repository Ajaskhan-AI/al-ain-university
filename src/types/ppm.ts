import type { Actor } from './user'

export type PpmFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

/** Derived, never stored: done if completed, else overdue/due from the due date. */
export type PpmStatus = 'done' | 'due' | 'overdue'

/** Checklist answers keyed by ChecklistItem.id: true/false for ticks, a number for readings. */
export type ChecklistResult = Record<string, boolean | number>

export interface PpmCompletion {
  by: Actor
  at: string
  /** Name typed by the technician on the form (as on a paper logbook). */
  technicianName: string
  results: ChecklistResult
  remarks: string
  /** Photos are preview-only in the demo, so only the file name is kept. */
  photoName?: string
}

export interface PpmTask {
  id: string // e.g. PPM-0001
  assetId: string
  title: string
  frequency: PpmFrequency
  dueDate: string // ISO date (yyyy-MM-dd)
  assignedTechnicianId?: string
  /** 'plan' = seeded schedule, 'predictive' = from Module 2, 'manual' = added by a user. */
  source: 'plan' | 'predictive' | 'manual'
  createdAt: string
  createdBy?: Actor
  completion?: PpmCompletion
}
