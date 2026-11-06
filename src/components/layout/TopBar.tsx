import { Menu } from 'lucide-react'
import type { CampusFilter } from '../../types'
import { CampusSwitcher } from './CampusSwitcher'
import { SampleBadge } from './SampleBadge'

interface Props {
  campus: CampusFilter
  onCampusChange: (value: CampusFilter) => void
  onOpenMenu: () => void
}

export function TopBar({ campus, onCampusChange, onOpenMenu }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-md p-1.5 text-navy-700 hover:bg-navy-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>

        {/* Logo text */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-navy-900">
            Kuroshio <span className="text-teal-600">AI</span>
          </span>
          <span className="hidden text-sm font-medium text-navy-400 sm:inline">FacilityIQ</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Wrapper controls visibility: the badge sets its own display class */}
          <div className="hidden md:block">
            <SampleBadge />
          </div>
          <CampusSwitcher value={campus} onChange={onCampusChange} />
        </div>
      </div>

      {/* On small screens the badge gets its own row so it is never hidden */}
      <div className="border-t border-navy-100 px-4 py-1.5 md:hidden">
        <SampleBadge />
      </div>
    </header>
  )
}
