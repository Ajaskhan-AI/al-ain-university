import { subMinutes } from 'date-fns'
import { getBuilding } from '../data/buildings'
import { COOLING } from '../data/energy'
import { OCCUPANCY, resolveDayType } from '../lib/calendar'
import type { AcademicPeriod, Reading, Smdb, SmdbStatus, SmdbThresholds } from '../types'
import { createRng, hashString } from './rng'

/**
 * Pure maths for the SMDB simulator (no React here, easy to test).
 *
 * Expected load = board peak kW × time-of-day shape × occupancy (academic
 * calendar) × cooling demand (month). HVAC boards get a bigger afternoon peak.
 */

const LINE_VOLTAGE = 400 // V, 3-phase line-to-line
const SQRT3 = Math.sqrt(3)

/** A couple of boards are "interesting" so the demo has something to show. */
const STRESS: Record<string, number> = {
  // Science labs HVAC board: ~73% of rating in the morning, ~84% in the afternoon cooling peak
  // (→ a realistic "High load" warning between about 13:00 and 17:00 on teaching days).
  'SMDB-AIN-B4-02': 1.52,
}
/** Per-phase current split. Default is nearly balanced; one board is close to the 15% limit. */
const PHASE_SPLIT: Record<string, [number, number, number]> = {
  'SMDB-AIN-B2-01': [1.07, 0.98, 0.95], // ~12% imbalance: lower the threshold to 10% to see an alert
}

export function boardPeakKw(smdb: Smdb): number {
  return (getBuilding(smdb.buildingId)?.baseLoadKw ?? 150) * smdb.loadShare
}

/** Hour-of-day shape (0.35 = night base load, ~1 = busy day). */
function hourShape(hour: number, hvac: boolean): number {
  if (hour < 6) return 0.35
  if (hour < 8) return 0.35 + (hour - 5) * 0.2 // morning ramp
  if (hour < 13) return 1
  if (hour < 17) return hvac ? 1.15 : 1.05 // afternoon cooling peak
  if (hour < 20) return 0.75
  if (hour < 22) return 0.5
  return 0.38
}

/** Expected kW for a board at a moment in time (before random noise). */
export function expectedKw(smdb: Smdb, at: Date, calendar: AcademicPeriod[]): number {
  const occupancy = OCCUPANCY[resolveDayType(at, calendar)]
  const hour = at.getHours() + at.getMinutes() / 60
  const shape = hourShape(hour, smdb.servesHvac)
  // Empty buildings flatten towards the base load.
  const activity = 0.35 + (shape - 0.35) * occupancy
  const cooling = COOLING[at.getMonth()] / 1.45
  const climate = smdb.servesHvac ? 0.55 + 0.45 * cooling : 0.8 + 0.2 * cooling
  return boardPeakKw(smdb) * activity * climate * (STRESS[smdb.id] ?? 1)
}

/** Stable per-board numbers (phase split, PF, starting kWh counter). */
export function boardConstants(smdb: Smdb) {
  const rng = createRng(hashString(`board:${smdb.id}`))
  const split = PHASE_SPLIT[smdb.id] ?? [1 + rng.range(-0.02, 0.02), 1 + rng.range(-0.02, 0.02), 1 + rng.range(-0.02, 0.02)]
  const mean = (split[0] + split[1] + split[2]) / 3
  return {
    split: split.map((s) => s / mean) as [number, number, number],
    pf: smdb.servesHvac ? rng.range(0.86, 0.9) : rng.range(0.91, 0.95),
    startKwh: Math.round(800_000 + rng.range(0, 1_200_000)),
  }
}

export type FaultType = 'trip' | 'overload'

/** Build one meter reading from a kW value (adds per-phase detail). */
export function makeReading(
  smdb: Smdb,
  at: Date,
  kW: number,
  kWh: number,
  random: () => number,
  fault?: FaultType,
): Reading {
  const { split, pf: basePf } = boardConstants(smdb)
  const pf = Math.min(0.99, basePf + (random() - 0.5) * 0.01)
  let power = kW
  if (fault === 'overload') {
    // Push the board to ~100-104% of its breaker rating.
    power = (smdb.ratedCurrentA * (1 + random() * 0.04) * SQRT3 * LINE_VOLTAGE * pf) / 1000 / Math.max(...split)
  }
  if (fault === 'trip') power = 0

  const avgCurrent = (power * 1000) / (SQRT3 * LINE_VOLTAGE * pf)
  // Voltage sags slightly with load.
  const loadRatio = avgCurrent / smdb.ratedCurrentA
  const phases = split.map((share) => ({
    voltageV: round(230 * (1 - 0.015 * loadRatio) + (random() - 0.5) * 3, 1),
    currentA: round(avgCurrent * share * (1 + (random() - 0.5) * 0.01), 1),
  })) as Reading['phases']

  return {
    smdbId: smdb.id,
    at: at.toISOString(),
    phases,
    kW: round(power, 1),
    kVA: round(power / pf, 1),
    pf: round(pf, 2),
    kWh: Math.round(kWh),
    frequencyHz: round(50 + (random() - 0.5) * 0.06, 2),
  }
}

export interface SmdbIssue {
  code: 'trip' | 'overload' | 'high_load' | 'imbalance' | 'voltage'
  severity: 'warning' | 'critical'
  title: string
  message: string
}

export interface SmdbHealth {
  status: SmdbStatus
  loadPct: number
  imbalancePct: number
  minV: number
  maxV: number
  issues: SmdbIssue[]
}

/** Status from CLAUDE.md rules, using the board's (editable) thresholds. */
export function computeHealth(reading: Reading, smdb: Smdb, t: SmdbThresholds): SmdbHealth {
  const currents = reading.phases.map((p) => p.currentA)
  const volts = reading.phases.map((p) => p.voltageV)
  const maxA = Math.max(...currents)
  const avgA = currents.reduce((s, c) => s + c, 0) / 3
  const loadPct = (maxA / smdb.ratedCurrentA) * 100
  // Imbalance = (highest − lowest phase current) ÷ average.
  const imbalancePct = avgA > 1 ? ((maxA - Math.min(...currents)) / avgA) * 100 : 0
  const minV = Math.min(...volts)
  const maxV = Math.max(...volts)
  const issues: SmdbIssue[] = []

  if (maxA < 1) {
    issues.push({ code: 'trip', severity: 'critical', title: 'SMDB tripped — zero current', message: `All phase currents dropped to zero on ${smdb.name}.` })
  } else {
    if (loadPct > t.critLoadPct) {
      issues.push({ code: 'overload', severity: 'critical', title: `Overload — ${Math.round(loadPct)}% of rating`, message: `Load on ${smdb.name} exceeded the ${t.critLoadPct}% critical threshold (${smdb.ratedCurrentA} A breaker).` })
    } else if (loadPct > t.warnLoadPct) {
      issues.push({ code: 'high_load', severity: 'warning', title: `High load — ${Math.round(loadPct)}% of rating`, message: `Load on ${smdb.name} exceeded the ${t.warnLoadPct}% warning threshold.` })
    }
    if (imbalancePct > t.imbalancePct) {
      issues.push({ code: 'imbalance', severity: 'warning', title: `Phase imbalance ${Math.round(imbalancePct)}%`, message: `Current imbalance between phases on ${smdb.name} is above the ${t.imbalancePct}% limit.` })
    }
  }
  const low = t.nominalVoltageV * (1 - t.voltageTolPct / 100)
  const high = t.nominalVoltageV * (1 + t.voltageTolPct / 100)
  if (minV < low || maxV > high) {
    const v = minV < low ? minV : maxV
    issues.push({ code: 'voltage', severity: 'warning', title: `Voltage ${minV < low ? 'low' : 'high'} — ${Math.round(v)} V`, message: `A phase voltage on ${smdb.name} is outside the ±${t.voltageTolPct}% band.` })
  }

  const status: SmdbStatus = issues.some((i) => i.code === 'trip')
    ? 'tripped'
    : issues.some((i) => i.severity === 'critical')
      ? 'critical'
      : issues.length
        ? 'warning'
        : 'normal'
  return { status, loadPct, imbalancePct, minV, maxV, issues }
}

export interface HistoryPoint {
  t: number // epoch ms
  kW: number
  loadPct: number
}

/** Last 24 h at 15-minute steps, seeded so it is the same on every reload. */
export function buildHistory(smdb: Smdb, now: Date, calendar: AcademicPeriod[]): HistoryPoint[] {
  const { pf, split } = boardConstants(smdb)
  const points: HistoryPoint[] = []
  for (let i = 96; i >= 1; i--) {
    const at = subMinutes(now, i * 15)
    const rng = createRng(hashString(`${smdb.id}:${Math.floor(at.getTime() / 900_000)}`))
    const kW = expectedKw(smdb, at, calendar) * rng.range(0.94, 1.06)
    const maxA = ((kW * 1000) / (SQRT3 * LINE_VOLTAGE * pf)) * Math.max(...split)
    points.push({ t: at.getTime(), kW: round(kW, 1), loadPct: round((maxA / smdb.ratedCurrentA) * 100, 1) })
  }
  return points
}

function round(value: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
