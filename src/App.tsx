import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import NotFoundPage from './pages/NotFoundPage'
import ComplaintsPage from './pages/complaints/ComplaintsPage'
import EnergyPage from './pages/energy/EnergyPage'
import HowItWorksPage from './pages/howItWorks/HowItWorksPage'
import OverviewPage from './pages/overview/OverviewPage'
import PpmPage from './pages/ppm/PpmPage'
import PredictivePage from './pages/predictive/PredictivePage'
import ReportPage from './pages/report/ReportPage'
import SmdbPage from './pages/smdb/SmdbPage'

/**
 * HashRouter keeps the route after a "#" (e.g. /#/complaints), so the app
 * works on any static host without server rewrite rules.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Routes nested here render inside the AppShell's <Outlet /> */}
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="smdb" element={<SmdbPage />} />
          <Route path="predictive" element={<PredictivePage />} />
          <Route path="ppm" element={<PpmPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="energy" element={<EnergyPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
