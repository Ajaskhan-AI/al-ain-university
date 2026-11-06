import type { Campus, CampusFilter } from '../types'

export const CAMPUSES: Campus[] = [
  { id: 'AIN', name: 'Al Ain Campus', shortName: 'Al Ain' },
  { id: 'AUH', name: 'Abu Dhabi Campus', shortName: 'Abu Dhabi' },
]

export const CAMPUS_FILTER_LABELS: Record<CampusFilter, string> = {
  ALL: 'Both campuses',
  AIN: 'Al Ain',
  AUH: 'Abu Dhabi',
}
