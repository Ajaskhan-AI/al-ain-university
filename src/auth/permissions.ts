import type { Role, User } from '../types'

/**
 * Every permission in the app. Components must check permissions with can(),
 * never compare role strings directly — so changing who can do what only
 * ever means editing the matrix below.
 *
 * Naming: "<area>.<action>". "...Own" = only items assigned to the user.
 */
export const PERMISSIONS = [
  // Overview (which KPI groups are visible)
  'overview.view',
  'overview.kpi.alerts',
  'overview.kpi.ppm',
  'overview.kpi.tickets',
  'overview.kpi.energy',
  // Module 1 — SMDB monitoring
  'smdb.view',
  'smdb.viewAssigned',
  'smdb.ackAlerts',
  'smdb.createWorkOrder',
  'smdb.editThresholds',
  'smdb.simulateFault',
  // Module 2 — Predictive maintenance
  'predictive.view',
  'predictive.act',
  // Module 3 — Logbook & PPM
  'ppm.view',
  'ppm.viewOwn',
  'ppm.complete',
  'ppm.completeOwn',
  'ppm.manage',
  // Module 4 — Complaints & work orders
  'tickets.view',
  'tickets.viewOwn',
  'tickets.create',
  'tickets.assign',
  'tickets.update',
  'tickets.updateOwn',
  // Module 5 — Energy analytics
  'energy.view',
  'energy.edit',
  // Module 6 — Monthly report (+ which sections a role gets)
  'report.view',
  'report.download',
  'report.section.ppm',
  'report.section.tickets',
  'report.section.energy',
  'report.section.alerts',
  // Admin / demo
  'users.view',
  'users.manage',
  'demo.reset',
  // Technician "My Jobs"
  'jobs.view',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL_KPIS: Permission[] = ['overview.view', 'overview.kpi.alerts', 'overview.kpi.ppm', 'overview.kpi.tickets', 'overview.kpi.energy']
const ALL_REPORT_SECTIONS: Permission[] = ['report.section.ppm', 'report.section.tickets', 'report.section.energy', 'report.section.alerts']

/** The permission matrix from CLAUDE.md, one row per role. */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  fm_manager: [
    ...ALL_KPIS,
    'smdb.view', 'smdb.editThresholds',
    'predictive.view',
    'ppm.view', 'ppm.manage',
    'tickets.view', 'tickets.create', 'tickets.assign',
    'energy.view',
    'report.view', 'report.download', ...ALL_REPORT_SECTIONS,
    'users.view',
  ],
  fm_engineer: [
    ...ALL_KPIS,
    'smdb.view', 'smdb.ackAlerts', 'smdb.createWorkOrder',
    'predictive.view', 'predictive.act',
    'ppm.view', 'ppm.complete', 'ppm.manage',
    'tickets.view', 'tickets.create', 'tickets.assign', 'tickets.update',
    'energy.view',
    'report.view', 'report.download', ...ALL_REPORT_SECTIONS,
  ],
  technician: [
    'jobs.view',
    'smdb.viewAssigned',
    'ppm.viewOwn', 'ppm.completeOwn',
    'tickets.viewOwn', 'tickets.updateOwn',
  ],
  helpdesk: [
    'overview.view', 'overview.kpi.tickets',
    'tickets.view', 'tickets.create', 'tickets.assign',
    'report.view', 'report.download', 'report.section.tickets',
  ],
  sustainability: [
    'overview.view', 'overview.kpi.energy',
    'smdb.view',
    'energy.view', 'energy.edit',
    'report.view', 'report.download', 'report.section.energy',
  ],
  admin: [
    ...ALL_KPIS,
    'smdb.view', 'smdb.ackAlerts', 'smdb.createWorkOrder', 'smdb.editThresholds', 'smdb.simulateFault',
    'predictive.view', 'predictive.act',
    'ppm.view', 'ppm.manage',
    'tickets.view', 'tickets.create',
    'energy.view',
    'report.view', ...ALL_REPORT_SECTIONS,
    'users.view', 'users.manage',
    'demo.reset',
  ],
}

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role]
}

/** The one place role checks happen. Usage: can(user, 'tickets.assign') */
export function can(user: User | null | undefined, permission: Permission): boolean {
  return !!user && ROLE_PERMISSIONS[user.role].includes(permission)
}

/** True if the user has at least one of the permissions (an empty list = everyone). */
export function canAny(user: User | null | undefined, permissions: readonly Permission[]): boolean {
  if (!user) return false
  return permissions.length === 0 || permissions.some((p) => can(user, p))
}

/** Which permissions open each page. Used by both the sidebar and the route guards. */
export const PAGE_ACCESS = {
  overview: ['overview.view'],
  smdb: ['smdb.view', 'smdb.viewAssigned'],
  predictive: ['predictive.view'],
  ppm: ['ppm.view', 'ppm.viewOwn'],
  complaints: ['tickets.view'],
  energy: ['energy.view'],
  report: ['report.view'],
  howItWorks: [],
  myJobs: ['jobs.view'],
  settings: ['smdb.editThresholds', 'smdb.simulateFault', 'users.view', 'users.manage', 'demo.reset'],
} as const satisfies Record<string, readonly Permission[]>
