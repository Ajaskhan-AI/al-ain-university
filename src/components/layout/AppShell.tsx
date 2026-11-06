import { useState } from 'react'
import { Outlet } from 'react-router'
import type { CampusFilter } from '../../types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * The frame around every logged-in page: sidebar + top bar + page content.
 * <Outlet /> is where React Router renders the current page.
 *
 * Campus is local state for now; in step 2 it moves into the central store
 * so every module can filter by it.
 */
export function AppShell() {
  const [campus, setCampus] = useState<CampusFilter>('ALL')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar
          campus={campus}
          onCampusChange={setCampus}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
