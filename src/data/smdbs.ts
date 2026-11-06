import type { CampusId, Smdb, SmdbThresholds } from '../types'
import { BUILDINGS } from './buildings'

export const DEFAULT_THRESHOLDS: SmdbThresholds = {
  warnLoadPct: 80,
  critLoadPct: 95,
  imbalancePct: 15,
  voltageTolPct: 10,
  nominalVoltageV: 230,
}

/** Standard breaker ratings; pick the smallest that leaves ~35% headroom. */
const RATINGS = [250, 400, 630, 800, 1000]

function ratingFor(peakKw: number): number {
  // 3-phase 400 V: I = P / (√3 × V × PF). PF 0.92.
  const peakA = (peakKw * 1000) / (Math.sqrt(3) * 400 * 0.92)
  return RATINGS.find((r) => r >= peakA * 1.35) ?? RATINGS[RATINGS.length - 1]
}

/** Two boards per building = 20 SMDBs. Board 02 carries HVAC plant (bigger share). */
export const SMDBS: Smdb[] = BUILDINGS.flatMap((building, index) => {
  const boards: Array<{ suffix: string; location: string; share: number; hvac: boolean }> = [
    { suffix: '01', location: 'Ground floor electrical room', share: 0.42, hvac: false },
    { suffix: '02', location: 'Roof plant room (HVAC)', share: 0.58, hvac: true },
  ]
  return boards.map((board, boardIndex) => ({
    id: `SMDB-${building.id}-${board.suffix}`,
    name: `SMDB-${board.suffix} · ${building.shortName}`,
    buildingId: building.id,
    campus: building.campus as CampusId,
    location: board.location,
    ratedCurrentA: ratingFor(building.baseLoadKw * board.share),
    meterId: `SEL-EM-${String(1001 + index * 2 + boardIndex)}`,
    loadShare: board.share,
    servesHvac: board.hvac,
  }))
})

const BY_ID = new Map(SMDBS.map((s) => [s.id, s]))

export function getSmdb(id: string): Smdb | undefined {
  return BY_ID.get(id)
}
