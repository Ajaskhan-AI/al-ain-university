import type { User } from '../types'

/** Fictional demo logins (one card each on the demo login screen). */
export const SEED_USERS: User[] = [
  { id: 'u-manager', name: 'Ahmed Al Mansoori', role: 'fm_manager', campus: 'ALL', initials: 'AM', jobTitle: 'FM Manager' },
  { id: 'u-eng-ain', name: 'Rashid Khan', role: 'fm_engineer', campus: 'AIN', initials: 'RK', jobTitle: 'FM Engineer — Al Ain' },
  { id: 'u-eng-auh', name: 'Priya Nair', role: 'fm_engineer', campus: 'AUH', initials: 'PN', jobTitle: 'FM Supervisor — Abu Dhabi' },
  { id: 'u-tech-joseph', name: 'Joseph Mathew', role: 'technician', campus: 'AIN', initials: 'JM', jobTitle: 'HVAC Technician', technicianId: 't-joseph' },
  { id: 'u-tech-imran', name: 'Imran Ali', role: 'technician', campus: 'AIN', initials: 'IA', jobTitle: 'Electrical Technician', technicianId: 't-imran' },
  { id: 'u-tech-suresh', name: 'Suresh Kumar', role: 'technician', campus: 'AIN', initials: 'SK', jobTitle: 'Plumbing Technician', technicianId: 't-suresh' },
  { id: 'u-helpdesk', name: 'Fatima Saeed', role: 'helpdesk', campus: 'ALL', initials: 'FS', jobTitle: 'FM Helpdesk Coordinator' },
  { id: 'u-sustain', name: 'Dr. Layla Hassan', role: 'sustainability', campus: 'ALL', initials: 'LH', jobTitle: 'Sustainability Officer' },
  { id: 'u-admin', name: 'Kuroshio Admin', role: 'admin', campus: 'ALL', initials: 'KA', jobTitle: 'System Admin (Kuroshio AI)' },
]
