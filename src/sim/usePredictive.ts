import { useMemo } from 'react'
import { toISODate } from '../lib/dates'
import { useAppState } from '../store/hooks'
import { assessAll, type Assessment } from './predictiveModel'

/**
 * Health assessments for all CT-monitored assets. Recalculated when assets
 * change, an asset is marked resolved, or the date changes.
 */
export function usePredictive(): Assessment[] {
  const { assets, predictiveResets } = useAppState()
  const day = toISODate(new Date())
  return useMemo(() => assessAll(assets, new Date(), predictiveResets), [assets, predictiveResets, day])
}
