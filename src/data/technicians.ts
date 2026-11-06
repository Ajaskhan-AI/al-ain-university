import type { Technician } from '../types'

/** Fictional FM technicians (8 = 4 trades × 2 campuses). */
export const SEED_TECHNICIANS: Technician[] = [
  { id: 't-joseph', name: 'Joseph Mathew', trade: 'hvac', campus: 'AIN', phone: '+971 50 000 0101', active: true },
  { id: 't-imran', name: 'Imran Ali', trade: 'electrical', campus: 'AIN', phone: '+971 50 000 0102', active: true },
  { id: 't-suresh', name: 'Suresh Kumar', trade: 'plumbing', campus: 'AIN', phone: '+971 50 000 0103', active: true },
  { id: 't-anil', name: 'Anil Thomas', trade: 'general', campus: 'AIN', phone: '+971 50 000 0104', active: true },
  { id: 't-ravi', name: 'Ravi Menon', trade: 'hvac', campus: 'AUH', phone: '+971 50 000 0201', active: true },
  { id: 't-tariq', name: 'Tariq Hussain', trade: 'electrical', campus: 'AUH', phone: '+971 50 000 0202', active: true },
  { id: 't-bilal', name: 'Bilal Ahmed', trade: 'plumbing', campus: 'AUH', phone: '+971 50 000 0203', active: true },
  { id: 't-sanjay', name: 'Sanjay Pillai', trade: 'general', campus: 'AUH', phone: '+971 50 000 0204', active: true },
]
