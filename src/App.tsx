import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { PAGE_ACCESS } from './auth/permissions'
import { RequirePermission } from './auth/RequirePermission'
import { ROLE_HOME } from './auth/roles'
import { useCurrentUser } from './auth/useCurrentUser'
import { ProtectedLayout } from './components/layout/ProtectedLayout'
import type { Permission } from './types'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ComplaintsPage from './pages/complaints/ComplaintsPage'
import EnergyPage from './pages/energy/EnergyPage'
import HowItWorksPage from './pages/howItWorks/HowItWorksPage'
import OverviewPage from './pages/overview/OverviewPage'
import PpmPage from './pages/ppm/PpmPage'
import PredictivePage from './pages/predictive/PredictivePage'
import ReportProblemPage from './pages/public/ReportProblemPage'
import ReportPage from './pages/report/ReportPage'
import SettingsPage from './pages/settings/SettingsPage'
import SmdbPage from './pages/smdb/SmdbPage'
import MyJobsPage from './pages/technician/MyJobsPage'

/** "/" sends each role to its own home page. */
function HomeRedirect() {
  const user = useCurrentUser()
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />
}

/** Shorthand: wrap a page in its permission guard. */
const guard = (access: readonly Permission[], page: ReactNode) => (
  <RequirePermission anyOf={access}>{page}</RequirePermission>
)

/**
 * HashRouter keeps the route after a "#" (e.g. /#/complaints), so the app
 * works on any static host without server rewrite rules.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public pages: no login needed */}
        <Route path="login" element={<LoginPage />} />
        <Route path="report/:roomId" element={<ReportProblemPage />} />

        {/* Everything else needs a demo login; pages render inside the shell's <Outlet /> */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="overview" element={guard(PAGE_ACCESS.overview, <OverviewPage />)} />
          <Route path="smdb" element={guard(PAGE_ACCESS.smdb, <SmdbPage />)} />
          <Route path="predictive" element={guard(PAGE_ACCESS.predictive, <PredictivePage />)} />
          <Route path="ppm" element={guard(PAGE_ACCESS.ppm, <PpmPage />)} />
          <Route path="complaints" element={guard(PAGE_ACCESS.complaints, <ComplaintsPage />)} />
          <Route path="energy" element={guard(PAGE_ACCESS.energy, <EnergyPage />)} />
          <Route path="report" element={guard(PAGE_ACCESS.report, <ReportPage />)} />
          <Route path="how-it-works" element={guard(PAGE_ACCESS.howItWorks, <HowItWorksPage />)} />
          <Route path="my-jobs" element={guard(PAGE_ACCESS.myJobs, <MyJobsPage />)} />
          <Route path="settings" element={guard(PAGE_ACCESS.settings, <SettingsPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
