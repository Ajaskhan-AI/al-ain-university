import type { PpmStatus, PpmTask } from '../types'

/** Status is worked out from the data, never stored, so it is always up to date. */
export function getPpmStatus(task: PpmTask, todayISO: string): PpmStatus {
  if (task.completion) return 'done'
  return task.dueDate < todayISO ? 'overdue' : 'due'
}
