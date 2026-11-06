import type { CampusFilter, CampusId } from '../types'

/** True if an item on `campus` should be shown under the current campus filter. */
export function matchesCampus(filter: CampusFilter, campus: CampusId): boolean {
  return filter === 'ALL' || filter === campus
}

export function filterByCampus<T extends { campus: CampusId }>(items: T[], filter: CampusFilter): T[] {
  return filter === 'ALL' ? items : items.filter((item) => item.campus === filter)
}
