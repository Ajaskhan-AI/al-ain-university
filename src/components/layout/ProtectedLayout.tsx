import { Navigate } from 'react-router'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { AppShell } from './AppShell'
import { MobileShell } from './MobileShell'

/** Not logged in → login screen. Technicians get the mobile layout; everyone else the desktop shell. */
export function ProtectedLayout() {
  const user = useCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'technician' ? <MobileShell /> : <AppShell />
}
