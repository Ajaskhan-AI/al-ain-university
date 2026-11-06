import { useAppState } from '../store/hooks'
import type { User } from '../types'

/** The logged-in demo user, or null when nobody is logged in. */
export function useCurrentUser(): User | null {
  const { users, currentUserId } = useAppState()
  return users.find((u) => u.id === currentUserId) ?? null
}
