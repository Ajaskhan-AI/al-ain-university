import {
  Activity,
  ChartColumn,
  ClipboardCheck,
  Cpu,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

/**
 * Sidebar order from CLAUDE.md. In step 3 each item gets a permission key
 * so the sidebar can hide items the current role cannot see.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/smdb', label: 'SMDB Monitoring', icon: Zap },
  { path: '/predictive', label: 'Predictive Maintenance', icon: Activity },
  { path: '/ppm', label: 'Logbook & PPM', icon: ClipboardCheck },
  { path: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { path: '/energy', label: 'Energy Analytics', icon: ChartColumn },
  { path: '/report', label: 'Monthly Report', icon: FileText },
  { path: '/how-it-works', label: 'How it works', icon: Cpu },
]
