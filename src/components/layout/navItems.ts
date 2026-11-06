import {
  Activity,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  Settings,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { PAGE_ACCESS } from '../../auth/permissions'
import type { Permission } from '../../types'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  /** Shown if the user has ANY of these (empty = everyone). Same lists guard the routes. */
  access: readonly Permission[]
}

/** Desktop sidebar, in the order from CLAUDE.md (+ Settings for Manager/Admin). */
export const NAV_ITEMS: NavItem[] = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard, access: PAGE_ACCESS.overview },
  { path: '/smdb', label: 'SMDB Monitoring', icon: Zap, access: PAGE_ACCESS.smdb },
  { path: '/predictive', label: 'Predictive Maintenance', icon: Activity, access: PAGE_ACCESS.predictive },
  { path: '/ppm', label: 'Logbook & PPM', icon: ClipboardCheck, access: PAGE_ACCESS.ppm },
  { path: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: PAGE_ACCESS.complaints },
  { path: '/energy', label: 'Energy Analytics', icon: ChartColumn, access: PAGE_ACCESS.energy },
  { path: '/report', label: 'Monthly Report', icon: FileText, access: PAGE_ACCESS.report },
  { path: '/how-it-works', label: 'How it works', icon: Cpu, access: PAGE_ACCESS.howItWorks },
  { path: '/settings', label: 'Settings', icon: Settings, access: PAGE_ACCESS.settings },
]

/** Bottom tab bar in the technician's mobile layout. */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { path: '/my-jobs', label: 'My Jobs', icon: ClipboardList, access: PAGE_ACCESS.myJobs },
  { path: '/ppm', label: 'PPM', icon: ClipboardCheck, access: PAGE_ACCESS.ppm },
  { path: '/smdb', label: 'SMDB', icon: Zap, access: PAGE_ACCESS.smdb },
  { path: '/how-it-works', label: 'How it works', icon: Cpu, access: PAGE_ACCESS.howItWorks },
]
