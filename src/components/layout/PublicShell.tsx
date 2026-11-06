import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { SampleBadge } from './SampleBadge'

/** Phone-width frame for the public pages (room QR form, request tracking). No login. */
export function PublicShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-navy-50 shadow-xl">
        <header className="bg-navy-900 px-5 py-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-teal-300">Al Ain University · Facilities Management</p>
            <Link to="/track" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20">
              <Search className="size-3.5" aria-hidden />
              Track a request
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          <SampleBadge className="mt-3" />
        </header>
        <main className="flex-1 px-5 py-6">{children}</main>
        <p className="pb-6 text-center text-xs text-navy-400">
          Kuroshio AI · FacilityIQ demo ·{' '}
          <Link to="/login" className="underline hover:text-navy-600">
            back to demo login
          </Link>
        </p>
      </div>
    </div>
  )
}
