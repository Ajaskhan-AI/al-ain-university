import type { Action } from './actions'
import { STATE_VERSION, type AppState } from './state'

/**
 * A reducer takes the current state + an action and returns the NEW state.
 * It must not mutate the old state (always return new objects), so React can
 * see that something changed and re-render.
 */
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET_DEMO':
      // Fresh data, logged out (CLAUDE.md: "Reset demo data" logs out too).
      return {
        version: STATE_VERSION,
        seededAt: action.at,
        currentUserId: null,
        campus: 'ALL',
        ...action.data,
      }

    case 'SET_CAMPUS':
      return { ...state, campus: action.campus }

    default: {
      // If a new action type is added but not handled, TypeScript errors here.
      const unhandled: never = action
      return unhandled
    }
  }
}
