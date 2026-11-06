import { buildSeed } from '../data/seed'
import type { CampusFilter } from '../types'
import type { AppData } from './state'

/**
 * Every change to the store is described by one of these "actions".
 * Components call dispatch(action); the reducer decides the new state.
 * Each module adds its own actions here as it is built.
 */
export type Action =
  | { type: 'RESET_DEMO'; data: AppData; at: string }
  | { type: 'SET_CAMPUS'; campus: CampusFilter }
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }

/** Action creators: small helpers so components don't build action objects by hand. */
export const actions = {
  /** Builds fresh seed data here (not in the reducer) so the reducer stays pure. */
  resetDemo(): Action {
    const now = new Date()
    return { type: 'RESET_DEMO', data: buildSeed(now), at: now.toISOString() }
  },
  setCampus(campus: CampusFilter): Action {
    return { type: 'SET_CAMPUS', campus }
  },
  /** Demo login: no password, just pick a user (also used by "Switch role"). */
  login(userId: string): Action {
    return { type: 'LOGIN', userId }
  },
  logout(): Action {
    return { type: 'LOGOUT' }
  },
}
