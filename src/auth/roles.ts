import type { Role } from '../types'

export const ROLE_LABELS: Record<Role, string> = {
  fm_manager: 'FM Manager',
  fm_engineer: 'FM Engineer / Supervisor',
  technician: 'Technician',
  helpdesk: 'Helpdesk / FM Coordinator',
  sustainability: 'Sustainability Officer',
  admin: 'System Admin',
}

/** Where each role lands after logging in (CLAUDE.md "Lands on"). */
export const ROLE_HOME: Record<Role, string> = {
  fm_manager: '/overview',
  fm_engineer: '/smdb', // alerts center lives in SMDB monitoring (step 7)
  technician: '/my-jobs',
  helpdesk: '/complaints',
  sustainability: '/energy',
  admin: '/settings',
}

/** Avatar colours per role (full class names so Tailwind can find them). */
export const ROLE_AVATAR: Record<Role, string> = {
  fm_manager: 'bg-navy-800 text-white',
  fm_engineer: 'bg-teal-600 text-white',
  technician: 'bg-amber-500 text-white',
  helpdesk: 'bg-sky-600 text-white',
  sustainability: 'bg-emerald-600 text-white',
  admin: 'bg-slate-600 text-white',
}

/** Order used on the login screen and in the role switcher. */
export const ROLE_ORDER: Role[] = ['fm_manager', 'fm_engineer', 'technician', 'helpdesk', 'sustainability', 'admin']
