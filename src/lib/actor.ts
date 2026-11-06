import type { Actor, User } from '../types'

/** The "who" stamp recorded on every action a logged-in user takes. */
export function actorFromUser(user: User): Actor {
  return { name: user.name, role: user.role, userId: user.id }
}

/** Public (not logged in) requester using a room QR code. */
export function requesterActor(name?: string): Actor {
  return { name: name?.trim() || 'Anonymous (room QR)', role: 'requester' }
}
