import { startOfMonth, subMonths } from 'date-fns'
import { atTime, toISODate } from '../lib/dates'
import { createRng, hashString } from '../sim/rng'
import type { AppData } from '../store/state'
import { SEED_CALENDAR } from './academicCalendar'
import { generateAlerts } from './alerts'
import { buildSeedAssets } from './assets'
import { generatePpmTasks } from './ppmTasks'
import { SEED_ROOMS } from './rooms'
import { DEFAULT_THRESHOLDS, SMDBS } from './smdbs'
import { SEED_TECHNICIANS } from './technicians'
import { generateTickets } from './tickets'
import { SEED_USERS } from './users'

/**
 * Builds the full editable demo dataset, relative to `now` so dates always look
 * current in the meeting. Seeded by today's date: same day → same data.
 * "Reset demo data" calls this again.
 */
export function buildSeed(now: Date): AppData {
  const rng = createRng(hashString(`aau-demo:${toISODate(now)}`))
  // structuredClone: give the store its own copies, so edits never touch the constants.
  const users = structuredClone(SEED_USERS)
  const technicians = structuredClone(SEED_TECHNICIANS)
  const rooms = structuredClone(SEED_ROOMS)
  const assets = buildSeedAssets(atTime(subMonths(startOfMonth(now), 6), 9).toISOString())

  const ppmTasks = generatePpmTasks({ assets, technicians, users, now, rng })
  const tickets = generateTickets({ rooms, technicians, users, now, rng })
  const alerts = generateAlerts(users, now)

  return {
    users,
    technicians,
    rooms,
    assets,
    ppmTasks,
    tickets,
    alerts,
    thresholds: Object.fromEntries(SMDBS.map((s) => [s.id, { ...DEFAULT_THRESHOLDS }])),
    calendar: structuredClone(SEED_CALENDAR),
    predictiveResets: {},
    reviewedWasteIds: [],
    counters: {
      ticket: 1001 + tickets.length,
      ppm: ppmTasks.length + 1,
      alert: alerts.length + 1,
    },
  }
}
