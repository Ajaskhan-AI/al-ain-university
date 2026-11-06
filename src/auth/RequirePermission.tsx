import type { ReactNode } from 'react'
import AccessRestrictedPage from '../pages/AccessRestrictedPage'
import type { Permission } from '../types'
import { canAny } from './permissions'
import { useCurrentUser } from './useCurrentUser'

/**
 * Route guard: renders the page only if the current user has ANY of the
 * permissions. Typing a forbidden URL directly shows "Access restricted".
 */
export function RequirePermission({ anyOf, children }: { anyOf: readonly Permission[]; children: ReactNode }) {
  const user = useCurrentUser()
  return canAny(user, anyOf) ? children : <AccessRestrictedPage />
}
