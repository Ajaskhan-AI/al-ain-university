import clsx from 'clsx'
import { ROLE_AVATAR } from '../../auth/roles'
import type { User } from '../../types'

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
}

export function UserAvatar({ user, size = 'md' }: { user: User; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        ROLE_AVATAR[user.role],
        SIZES[size],
      )}
    >
      {user.initials}
    </span>
  )
}
