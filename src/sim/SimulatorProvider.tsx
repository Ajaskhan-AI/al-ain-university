import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { can } from '../auth/permissions'
import { useCurrentUser } from '../auth/useCurrentUser'
import { useToast } from '../components/ui/toastContext'
import { DEFAULT_THRESHOLDS, SMDBS } from '../data/smdbs'
import { actions } from '../store/actions'
import { useAppDispatch, useAppState } from '../store/hooks'
import type { Alert, Reading } from '../types'
import { SimulatorContext, type SimulatorValue } from './simulatorContext'
import { boardConstants, buildHistory, computeHealth, expectedKw, makeReading, type FaultType } from './smdbModel'
import { usePredictive } from './usePredictive'

const INTERVAL_MS = 4000
/** An alert auto-resolves after its condition has been clear for this many updates (avoids flapping). */
const CLEAR_TICKS = 3

/**
 * The live data engine (Module 1). Every 4 s it produces new readings for all
 * 20 SMDBs, works out their status from the editable thresholds, raises
 * alerts for new problems (with a toast) and resolves alerts that cleared.
 * In a real deployment these readings would come from the meters instead.
 */
export function SimulatorProvider({ children }: { children: ReactNode }) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const user = useCurrentUser()
  const toast = useToast()

  // Values the interval callback needs, kept fresh in refs (the interval itself never restarts).
  const calendarRef = useRef(state.calendar)
  calendarRef.current = state.calendar

  const [faults, setFaults] = useState<Record<string, FaultType>>({})
  const faultsRef = useRef(faults)
  faultsRef.current = faults

  // Random-walk noise and running kWh counter per board.
  const walkRef = useRef<Record<string, number>>({})
  const kwhRef = useRef<Record<string, number>>(Object.fromEntries(SMDBS.map((s) => [s.id, boardConstants(s).startKwh])))
  const lastTickRef = useRef(Date.now())

  const computeReadings = useCallback((): Record<string, Reading> => {
    const now = new Date()
    const hours = (now.getTime() - lastTickRef.current) / 3_600_000
    lastTickRef.current = now.getTime()
    const next: Record<string, Reading> = {}
    for (const smdb of SMDBS) {
      // Noise drifts slowly (±7%) instead of jumping, like real load.
      const walk = Math.min(1.07, Math.max(0.93, (walkRef.current[smdb.id] ?? 1) + (Math.random() - 0.5) * 0.02))
      walkRef.current[smdb.id] = walk
      const kW = expectedKw(smdb, now, calendarRef.current) * walk
      const reading = makeReading(smdb, now, kW, kwhRef.current[smdb.id], Math.random, faultsRef.current[smdb.id])
      kwhRef.current[smdb.id] += reading.kW * hours
      next[smdb.id] = reading
    }
    return next
  }, [])

  const [readings, setReadings] = useState<Record<string, Reading>>(() => computeReadings())
  const [updatedAt, setUpdatedAt] = useState(() => Date.now())
  const tick = useCallback(() => {
    setReadings(computeReadings())
    setUpdatedAt(Date.now())
  }, [computeReadings])

  useEffect(() => {
    const id = window.setInterval(tick, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [tick])

  // 24 h history, generated once.
  const [history] = useState(() => Object.fromEntries(SMDBS.map((s) => [s.id, buildHistory(s, new Date(), state.calendar)])))

  // Status depends on the thresholds too, so editing a threshold changes status immediately.
  const health = useMemo(
    () => Object.fromEntries(SMDBS.map((s) => [s.id, computeHealth(readings[s.id], s, state.thresholds[s.id] ?? DEFAULT_THRESHOLDS)])),
    [readings, state.thresholds],
  )

  // ---------- Alert sync ----------
  const clearCountsRef = useRef<Map<string, number>>(new Map())
  const pendingRef = useRef<Map<string, number>>(new Map()) // raised, not yet in the store
  const countedTickRef = useRef(0)
  const canSeeSmdb = can(user, 'smdb.view')

  useEffect(() => {
    const now = Date.now()
    const open = state.alerts.filter((a) => a.source === 'smdb' && !a.resolvedAt && a.code && a.smdbId)
    const openKey = new Set(open.map((a) => `${a.smdbId}:${a.code}`))
    for (const key of [...pendingRef.current.keys()]) {
      if (openKey.has(key) || now - (pendingRef.current.get(key) ?? 0) > 10_000) pendingRef.current.delete(key)
    }

    const toRaise: Array<Omit<Alert, 'id'>> = []
    for (const smdb of SMDBS) {
      for (const issue of health[smdb.id]?.issues ?? []) {
        const key = `${smdb.id}:${issue.code}`
        clearCountsRef.current.delete(key)
        if (openKey.has(key) || pendingRef.current.has(key)) continue
        pendingRef.current.set(key, now)
        toRaise.push({
          source: 'smdb',
          severity: issue.severity,
          title: issue.title,
          message: issue.message,
          campus: smdb.campus,
          buildingId: smdb.buildingId,
          smdbId: smdb.id,
          code: issue.code,
          createdAt: new Date(now).toISOString(),
          notes: [],
        })
      }
    }

    // Count "clear" updates only once per tick (this effect also runs when alerts change).
    const toResolve: string[] = []
    const isNewTick = countedTickRef.current !== updatedAt
    countedTickRef.current = updatedAt
    for (const alert of open) {
      const key = `${alert.smdbId}:${alert.code}`
      const present = health[alert.smdbId ?? '']?.issues.some((i) => i.code === alert.code)
      if (present) continue
      const count = (clearCountsRef.current.get(key) ?? 0) + (isNewTick ? 1 : 0)
      if (count >= CLEAR_TICKS) {
        toResolve.push(alert.id)
        clearCountsRef.current.delete(key)
      } else clearCountsRef.current.set(key, count)
    }

    if (toRaise.length) {
      dispatch(actions.raiseAlerts(toRaise))
      if (canSeeSmdb) {
        for (const a of toRaise.slice(0, 3)) {
          const smdb = SMDBS.find((s) => s.id === a.smdbId)
          toast.show(`${a.title} — ${smdb?.name ?? a.smdbId}`, a.severity === 'critical' ? 'alert' : 'warn')
        }
      }
    }
    if (toResolve.length) dispatch(actions.resolveAlerts(toResolve))
  }, [health, state.alerts, updatedAt, dispatch, toast, canSeeSmdb])

  // ---------- Predictive (Module 2) alert sync ----------
  // One alert per asset while its health is in "Alert"; resolved when the asset recovers.
  const assessments = usePredictive()
  const pendingPredictiveRef = useRef<Set<string>>(new Set())
  const canSeePredictive = can(user, 'predictive.view')

  useEffect(() => {
    const open = state.alerts.filter((a) => a.source === 'predictive' && a.code === 'health' && !a.resolvedAt)
    for (const id of [...pendingPredictiveRef.current]) if (open.some((a) => a.assetId === id)) pendingPredictiveRef.current.delete(id)

    const toRaise: Array<Omit<Alert, 'id'>> = []
    const toResolve: string[] = []
    for (const assessment of assessments) {
      const asset = state.assets.find((a) => a.id === assessment.assetId)
      if (!asset) continue
      const existing = open.find((a) => a.assetId === asset.id)
      if (assessment.status === 'alert' && assessment.issue) {
        if (existing || pendingPredictiveRef.current.has(asset.id)) continue
        pendingPredictiveRef.current.add(asset.id)
        toRaise.push({
          source: 'predictive',
          severity: 'critical',
          title: assessment.issue.title,
          message: `Health score ${assessment.health}/100 on ${asset.name} (${asset.id}). ${assessment.issue.detail}`,
          campus: asset.campus,
          buildingId: asset.buildingId,
          assetId: asset.id,
          code: 'health',
          createdAt: new Date().toISOString(),
          notes: [],
        })
      } else if (existing) {
        toResolve.push(existing.id)
      }
    }
    if (toRaise.length) {
      dispatch(actions.raiseAlerts(toRaise))
      if (canSeePredictive) for (const a of toRaise) toast.show(`Predictive: ${a.title}`, 'alert')
    }
    if (toResolve.length) dispatch(actions.resolveAlerts(toResolve))
  }, [assessments, state.alerts, state.assets, dispatch, toast, canSeePredictive])

  // ---------- Demo faults ----------

  const injectFault = useCallback(
    (smdbId: string, type: FaultType) => {
      faultsRef.current = { ...faultsRef.current, [smdbId]: type }
      setFaults(faultsRef.current)
      tick() // show it immediately, don't wait for the next interval
    },
    [tick],
  )
  const clearFault = useCallback(
    (smdbId: string) => {
      const next = { ...faultsRef.current }
      delete next[smdbId]
      faultsRef.current = next
      setFaults(next)
      tick()
    },
    [tick],
  )

  /** Used by "Reset demo data": remove every simulated fault and refresh readings at once. */
  const clearAllFaults = useCallback(() => {
    faultsRef.current = {}
    setFaults({})
    tick()
  }, [tick])

  const value = useMemo<SimulatorValue>(
    () => ({ readings, health, history, faults, injectFault, clearFault, clearAllFaults, updatedAt, intervalMs: INTERVAL_MS }),
    [readings, health, history, faults, injectFault, clearFault, clearAllFaults, updatedAt],
  )

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>
}
