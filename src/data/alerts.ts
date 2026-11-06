import { addHours, addMinutes, subDays } from 'date-fns'
import { atTime } from '../lib/dates'
import type { Alert, AlertSeverity, AlertSource, CampusId, User } from '../types'
import { getSmdb } from './smdbs'

/** Historical, already-handled alerts from the last month (live ones come from the simulator in step 7). */
interface AlertRow {
  daysAgo: number
  hour: number
  source: AlertSource
  severity: AlertSeverity
  title: string
  message: string
  smdbId?: string
  assetId?: string
  buildingId: string
  note?: string
}

const ROWS: AlertRow[] = [
  { daysAgo: 21, hour: 14, source: 'smdb', severity: 'warning', smdbId: 'SMDB-AIN-B4-02', buildingId: 'AIN-B4', title: 'High load — 86% of rating', message: 'Load on SMDB-02 Science Labs exceeded the 80% warning threshold during the afternoon cooling peak.' },
  { daysAgo: 17, hour: 14, source: 'smdb', severity: 'critical', smdbId: 'SMDB-AUH-B1-02', buildingId: 'AUH-B1', title: 'Overload — 97% of rating', message: 'Load on SMDB-02 Academic exceeded the 95% critical threshold.', note: 'Chiller 2 staging fault — reset by HVAC team.' },
  { daysAgo: 12, hour: 10, source: 'smdb', severity: 'warning', smdbId: 'SMDB-AIN-B2-01', buildingId: 'AIN-B2', title: 'Phase imbalance 17%', message: 'Current imbalance between L1 and L3 above the 15% limit.' },
  { daysAgo: 9, hour: 7, source: 'smdb', severity: 'critical', smdbId: 'SMDB-AIN-B5-01', buildingId: 'AIN-B5', title: 'SMDB tripped — zero current', message: 'All phase currents dropped to zero on SMDB-01 Student Centre.', note: 'Breaker reset after kitchen equipment fault.' },
  { daysAgo: 8, hour: 11, source: 'predictive', severity: 'warning', assetId: 'AAU-AIN-AHU-02', buildingId: 'AIN-B3', title: 'Rising motor current — possible filter clogging', message: 'Fan motor current trending above its normal band for 5 days.', note: 'Filters replaced during PPM.' },
  { daysAgo: 6, hour: 9, source: 'smdb', severity: 'warning', smdbId: 'SMDB-AUH-B4-02', buildingId: 'AUH-B4', title: 'Low voltage — 203 V on L2', message: 'Phase L2 voltage below the −10% tolerance band.' },
  { daysAgo: 4, hour: 13, source: 'predictive', severity: 'warning', assetId: 'AAU-AUH-PMP-01', buildingId: 'AUH-B1', title: 'Current signature change — possible bearing wear', message: 'Motor current signature shows a new periodic component.' },
  { daysAgo: 2, hour: 15, source: 'smdb', severity: 'warning', smdbId: 'SMDB-AIN-B6-02', buildingId: 'AIN-B6', title: 'High load — 82% of rating', message: 'Load on SMDB-02 Lecture Halls exceeded the 80% warning threshold.' },
]

export function generateAlerts(users: User[], now: Date): Alert[] {
  const engineerFor = (campus: CampusId) => users.find((u) => u.role === 'fm_engineer' && u.campus === campus)

  return ROWS.map((row, i): Alert => {
    const campus = (row.smdbId ? getSmdb(row.smdbId)?.campus : undefined) ?? (row.buildingId.slice(0, 3) as CampusId)
    const created = addMinutes(atTime(subDays(now, row.daysAgo), row.hour), 7 * i)
    const engineer = engineerFor(campus)
    const by = engineer
      ? { name: engineer.name, role: engineer.role, userId: engineer.id }
      : { name: 'FM team', role: 'system' as const }
    const acknowledgedAt = addMinutes(created, 6 + i * 3)
    return {
      id: `ALT-${String(i + 1).padStart(4, '0')}`,
      source: row.source,
      severity: row.severity,
      title: row.title,
      message: row.message,
      campus,
      buildingId: row.buildingId,
      ...(row.smdbId ? { smdbId: row.smdbId } : {}),
      ...(row.assetId ? { assetId: row.assetId } : {}),
      createdAt: created.toISOString(),
      acknowledged: { by, at: acknowledgedAt.toISOString() },
      notes: row.note ? [{ by, at: addMinutes(acknowledgedAt, 20).toISOString(), text: row.note }] : [],
      resolvedAt: addHours(created, 3 + i).toISOString(),
    }
  })
}
