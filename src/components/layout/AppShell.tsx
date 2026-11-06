import { useState } from 'react'
import { Outlet } from 'react-router'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * The frame around every logged-in page: sidebar + top bar + page content.
 * <Outlet /> is where React Router renders the current page.
 */
export function AppShell() {
  const { campus } = useAppState()
  const dispatch = useAppDispatch()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleReset = () => {
    if (window.confirm('Reset all demo data to the original sample data?')) {
      dispatch(actions.resetDemo())
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar
          campus={campus}
          onCampusChange={(value) => dispatch(actions.setCampus(value))}
          onOpenMenu={() => setMenuOpen(true)}
          onReset={handleReset}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
