import { lazy, Suspense, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { PAGE_ACCESS } from './auth/permissions'
import { RequirePermission } from './auth/RequirePermission'
import { ROLE_HOME } from './auth/roles'
import { useCurrentUser } from './auth/useCurrentUser'
import { ProtectedLayout } from './components/layout/ProtectedLayout'
import { PageLoader } from './components/ui/PageLoader'
import type { Permission } from './types'
import NotFoundPage from './pages/NotFoundPage'

// Each page is loaded on first visit (code splitting), so the app opens faster.
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ComplaintsPage = lazy(() => import('./pages/complaints/ComplaintsPage'))
const RoomQrPage = lazy(() => import('./pages/complaints/RoomQrPage'))
const TicketDetailPage = lazy(() => import('./pages/complaints/TicketDetailPage'))
const EnergyPage = lazy(() => import('./pages/energy/EnergyPage'))
const HowItWorksPage = lazy(() => import('./pages/howItWorks/HowItWorksPage'))
const OverviewPage = lazy(() => import('./pages/overview/OverviewPage'))
const AssetPage = lazy(() => import('./pages/ppm/AssetPage'))
const PpmPage = lazy(() => import('./pages/ppm/PpmPage'))
const ScanPage = lazy(() => import('./pages/ppm/ScanPage'))
const TaskPage = lazy(() => import('./pages/ppm/TaskPage'))
const PredictiveAssetPage = lazy(() => import('./pages/predictive/PredictiveAssetPage'))
const PredictivePage = lazy(() => import('./pages/predictive/PredictivePage'))
const ReportProblemPage = lazy(() => import('./pages/public/ReportProblemPage'))
const TrackRequestPage = lazy(() => import('./pages/public/TrackRequestPage'))
const ReportPage = lazy(() => import('./pages/report/ReportPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const AlertsPage = lazy(() => import('./pages/smdb/AlertsPage'))
const SmdbDetailPage = lazy(() => import('./pages/smdb/SmdbDetailPage'))
const SmdbPage = lazy(() => import('./pages/smdb/SmdbPage'))
const MyJobsPage = lazy(() => import('./pages/technician/MyJobsPage'))

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
      {/* Shown while a page's code is downloading (the shells have their own inner fallback) */}
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          {/* Public pages: no login needed */}
          <Route path="login" element={<LoginPage />} />
          <Route path="report/:roomId" element={<ReportProblemPage />} />
          <Route path="track" element={<TrackRequestPage />} />
          <Route path="track/:ticketId" element={<TrackRequestPage />} />
  
          {/* Everything else needs a demo login; pages render inside the shell's <Outlet /> */}
          <Route element={<ProtectedLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="overview" element={guard(PAGE_ACCESS.overview, <OverviewPage />)} />
            <Route path="smdb" element={guard(PAGE_ACCESS.smdb, <SmdbPage />)} />
            <Route path="smdb/alerts" element={guard(PAGE_ACCESS.smdb, <AlertsPage />)} />
            {/* The page itself checks which boards a technician may open */}
            <Route path="smdb/:smdbId" element={guard(PAGE_ACCESS.smdb, <SmdbDetailPage />)} />
            <Route path="predictive" element={guard(PAGE_ACCESS.predictive, <PredictivePage />)} />
            <Route path="predictive/:assetId" element={guard(PAGE_ACCESS.predictive, <PredictiveAssetPage />)} />
            <Route path="ppm" element={guard(PAGE_ACCESS.ppm, <PpmPage />)} />
            <Route path="ppm/scan" element={guard(PAGE_ACCESS.ppm, <ScanPage />)} />
            <Route path="ppm/assets/:assetId" element={guard(PAGE_ACCESS.ppm, <AssetPage />)} />
            {/* Technicians may open their own tasks; the page checks ownership itself */}
            <Route path="ppm/tasks/:taskId" element={guard(PAGE_ACCESS.ppm, <TaskPage />)} />
            <Route path="complaints" element={guard(PAGE_ACCESS.complaints, <ComplaintsPage />)} />
            <Route path="complaints/rooms" element={guard(PAGE_ACCESS.complaints, <RoomQrPage />)} />
            {/* Technicians may open their own tickets; the page checks ownership itself */}
            <Route path="complaints/:ticketId" element={guard(['tickets.view', 'tickets.viewOwn'], <TicketDetailPage />)} />
            <Route path="energy" element={guard(PAGE_ACCESS.energy, <EnergyPage />)} />
            <Route path="report" element={guard(PAGE_ACCESS.report, <ReportPage />)} />
            <Route path="how-it-works" element={guard(PAGE_ACCESS.howItWorks, <HowItWorksPage />)} />
            <Route path="my-jobs" element={guard(PAGE_ACCESS.myJobs, <MyJobsPage />)} />
            <Route path="settings" element={guard(PAGE_ACCESS.settings, <SettingsPage />)} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
