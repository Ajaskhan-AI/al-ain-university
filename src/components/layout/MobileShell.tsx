import clsx from 'clsx'
import { MapPin, RotateCcw } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { canAny } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CAMPUS_FILTER_LABELS } from '../../data/campuses'
import { MOBILE_NAV_ITEMS } from './navItems'
import { RoleSwitcher } from './RoleSwitcher'
import { SampleBadge } from './SampleBadge'
import { useResetDemo } from './useResetDemo'

/**
 * Mobile-first frame for Technicians (what they see on a phone):
 * compact header, single column, bottom tab bar. On a projector it shows as a
 * centred phone-width column.
 */
export function MobileShell() {
  const user = useCurrentUser()
  const resetDemo = useResetDemo()
  const items = MOBILE_NAV_ITEMS.filter((item) => canAny(user, item.access))

  return (
    <div className="min-h-screen bg-navy-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-navy-50 shadow-xl">
        <header className="sticky top-0 z-20 border-b border-navy-100 bg-white">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-navy-900">
                Kuroshio <span className="text-teal-600">AI</span>
                <span className="ml-1.5 text-sm font-medium text-navy-400">FacilityIQ</span>
              </p>
              {user && (
                <p className="flex items-center gap-1 text-xs text-navy-500">
                  <MapPin className="size-3" aria-hidden />
                  {CAMPUS_FILTER_LABELS[user.campus]} · {user.jobTitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={resetDemo}
              title="Reset demo data"
              aria-label="Reset demo data"
              className="rounded-lg border border-navy-200 p-2 text-navy-600 hover:bg-navy-50"
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <RoleSwitcher compact />
          </div>
          <div className="border-t border-navy-100 px-4 py-1.5">
            <SampleBadge />
          </div>
        </header>

        <main className="flex-1 px-4 pt-5 pb-24">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-lg border-t border-navy-100 bg-white">
          {items.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              // "end" = exact match, so /ppm isn't highlighted while on /ppm/scan
              end={path === '/ppm'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium',
                  isActive ? 'text-teal-700' : 'text-navy-500',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
