import type { NewTicketInput } from '../store/actions'
import type { Actor, Alert, Asset, TicketCategory } from '../types'

/**
 * Turns an alert into a real work order (Module 4 ticket).
 * SMDB alerts → electrical; predictive alerts → the asset's trade.
 */
export function workOrderFromAlert(alert: Alert, assets: Asset[], id: string, by: Actor): NewTicketInput {
  const asset = alert.assetId
    ? assets.find((a) => a.id === alert.assetId)
    : assets.find((a) => a.smdbId && a.smdbId === alert.smdbId)
  let category: TicketCategory = 'electrical'
  if (alert.source !== 'smdb' && asset) {
    category = asset.trade === 'hvac' ? 'ac' : asset.trade === 'plumbing' ? 'plumbing' : asset.trade === 'electrical' ? 'electrical' : 'other'
  }
  return {
    id,
    buildingId: alert.buildingId,
    campus: alert.campus,
    ...(alert.smdbId ? { smdbId: alert.smdbId } : {}),
    ...(asset ? { assetId: asset.id } : {}),
    category,
    description: `${alert.title}. ${alert.message} (from alert ${alert.id})`,
    priority: alert.severity === 'critical' ? 'high' : 'medium',
    source: alert.source === 'smdb' ? 'smdb_alert' : alert.source === 'predictive' ? 'predictive' : 'energy',
    by,
  }
}
