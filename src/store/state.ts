import { buildSeed } from '../data/seed'
import type {
  AcademicPeriod,
  ActionStamp,
  Alert,
  Asset,
  CampusFilter,
  PpmTask,
  Room,
  SmdbThresholds,
  Technician,
  Ticket,
  User,
} from '../types'

/**
 * Everything users can change during the demo. Saved to localStorage and
 * restored by "Reset demo data". Fixed reference data (buildings, SMDB list)
 * and generated history (energy) live in src/data and are not stored here.
 */
export interface AppData {
  users: User[]
  technicians: Technician[]
  rooms: Room[]
  assets: Asset[]
  ppmTasks: PpmTask[]
  tickets: Ticket[]
  alerts: Alert[]
  /** Per-SMDB alarm thresholds, keyed by SMDB id. */
  thresholds: Record<string, SmdbThresholds>
  calendar: AcademicPeriod[]
  /** Predictive maintenance: assets marked resolved (health resets from this moment). */
  predictiveResets: Record<string, ActionStamp>
  /** Energy waste flags marked "reviewed" in Module 5. */
  reviewedWasteIds: string[]
  /** Next number for new IDs (WO-xxxx, PPM-xxxx, ALT-xxxx). */
  counters: { ticket: number; ppm: number; alert: number }
}

export interface AppState extends AppData {
  /** Bump when the shape changes: old saved data is then ignored and re-seeded. */
  version: number
  seededAt: string
  currentUserId: string | null
  campus: CampusFilter
}

// v2: added predictiveResets (step 8). Older saved data is re-seeded automatically.
export const STATE_VERSION = 2

export function createInitialState(now: Date): AppState {
  return {
    version: STATE_VERSION,
    seededAt: now.toISOString(),
    currentUserId: null,
    campus: 'ALL',
    ...buildSeed(now),
  }
}
