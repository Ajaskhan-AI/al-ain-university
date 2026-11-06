import { useEffect, useReducer, type ReactNode } from 'react'
import { AppDispatchContext, AppStateContext } from './context'
import { loadState, saveState } from './persistence'
import { appReducer } from './reducer'
import { createInitialState } from './state'

/** Wraps the whole app so every component can read the store and dispatch actions. */
export function AppProvider({ children }: { children: ReactNode }) {
  // The 3rd argument runs once: restore saved data, or build fresh seed data.
  const [state, dispatch] = useReducer(appReducer, null, () => loadState() ?? createInitialState(new Date()))

  // Save after every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}
