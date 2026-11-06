import { createContext, useContext } from 'react'
import type { Reading } from '../types'
import type { FaultType, HistoryPoint, SmdbHealth } from './smdbModel'

export interface SimulatorValue {
  /** Latest meter reading per SMDB id. */
  readings: Record<string, Reading>
  /** Status + issues per SMDB, from the readings and the current thresholds. */
  health: Record<string, SmdbHealth>
  /** Last 24 h (15-min steps) per SMDB, generated at start-up. */
  history: Record<string, HistoryPoint[]>
  /** Demo faults currently forced on boards. */
  faults: Record<string, FaultType>
  injectFault: (smdbId: string, type: FaultType) => void
  clearFault: (smdbId: string) => void
  /** Time of the last update (ms). */
  updatedAt: number
  intervalMs: number
}

export const SimulatorContext = createContext<SimulatorValue | null>(null)

export function useSimulator(): SimulatorValue {
  const value = useContext(SimulatorContext)
  if (!value) throw new Error('useSimulator must be used inside <SimulatorProvider>')
  return value
}
