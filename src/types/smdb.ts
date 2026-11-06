import type { CampusId } from './campus'

/** Sub-Main Distribution Board with an energy meter (Selec, RS-485/Modbus). */
export interface Smdb {
  id: string // e.g. SMDB-AIN-B2-01
  name: string
  buildingId: string
  campus: CampusId
  location: string
  ratedCurrentA: number
  meterId: string
  /** Share of the building's load on this board (0–1). */
  loadShare: number
  /** Feeds HVAC plant → bigger afternoon cooling peak. */
  servesHvac: boolean
}

/** Configurable per SMDB on the settings page. */
export interface SmdbThresholds {
  warnLoadPct: number // % of rated current → Warning
  critLoadPct: number // % of rated current → Critical
  imbalancePct: number // max deviation between phases
  voltageTolPct: number // ± around nominal
  nominalVoltageV: number // phase-to-neutral
}

export interface PhaseReading {
  voltageV: number
  currentA: number
}

export interface Reading {
  smdbId: string
  at: string
  phases: [PhaseReading, PhaseReading, PhaseReading]
  kW: number
  kVA: number
  pf: number
  /** Cumulative energy counter, like the meter's register. */
  kWh: number
  frequencyHz: number
}

export type SmdbStatus = 'normal' | 'warning' | 'critical' | 'tripped'
