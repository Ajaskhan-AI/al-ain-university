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

    case 'SET_CAMPUS': {
      // Campus scoping: single-campus users are locked to their own campus.
      const user = state.users.find((u) => u.id === state.currentUserId)
      if (user && user.campus !== 'ALL') return state
      return { ...state, campus: action.campus }
    }

    case 'LOGIN': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      // Both-campus users start on "Both"; single-campus users see only theirs.
      return { ...state, currentUserId: user.id, campus: user.campus }
    }

    case 'LOGOUT':
      return { ...state, currentUserId: null, campus: 'ALL' }

    default: {
      // If a new action type is added but not handled, TypeScript errors here.
      const unhandled: never = action
      return unhandled
    }
  }
}
