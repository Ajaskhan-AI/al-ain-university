import { createContext, type Dispatch } from 'react'
import type { Action } from './actions'
import type { AppState } from './state'

/**
 * Two contexts: one for reading state, one for dispatching actions.
 * Components that only dispatch don't re-render when the state changes.
 */
export const AppStateContext = createContext<AppState | null>(null)
export const AppDispatchContext = createContext<Dispatch<Action> | null>(null)
