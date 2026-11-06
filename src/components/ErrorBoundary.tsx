import { Component, type ErrorInfo, type ReactNode } from 'react'
import { STORAGE_KEY } from '../store/persistence'

const RELOAD_KEY = 'aau-fm-demo:reloaded-at'

/** True for "this page's code file no longer exists" — happens after a new deployment. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message)
}

/**
 * Reload once to pick up the newest deployment. The timestamp in sessionStorage
 * stops an endless reload loop if the problem is something else.
 */
export function reloadOnceForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 10_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // sessionStorage unavailable: still try one reload
  }
  window.location.reload()
  return true
}

interface State {
  error: Error | null
}

/**
 * Catches crashes anywhere in the app and shows a recovery screen instead of a
 * blank page. (React needs a class component for this — there is no hook yet.)
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack)
    if (isChunkLoadError(error)) reloadOnceForNewVersion()
  }

  private resetData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    window.location.hash = '#/login'
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    const newVersion = isChunkLoadError(this.state.error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="text-sm font-semibold text-teal-700">Kuroshio AI · FacilityIQ</p>
          <h1 className="mt-2 text-2xl font-bold text-navy-900">
            {newVersion ? 'A new version is available' : 'Something went wrong'}
          </h1>
          <p className="mt-2 text-navy-600">
            {newVersion
              ? 'The demo was updated while this page was open. Reload to continue.'
              : 'Reload the page. If it keeps happening, reset the demo data to start fresh.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-navy-800 px-4 py-2 font-semibold text-white hover:bg-navy-700"
            >
              Reload
            </button>
            {!newVersion && (
              <button
                type="button"
                onClick={this.resetData}
                className="rounded-lg border border-navy-200 px-4 py-2 font-semibold text-navy-700 hover:bg-navy-50"
              >
                Reset demo data
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
