import { Pencil, UserPlus, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { can } from '../../auth/permissions'
import { ROLE_LABELS, ROLE_ORDER } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { inputClass } from '../../components/ui/styles'
import { useToast } from '../../components/ui/toastContext'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { CAMPUS_FILTER_LABELS } from '../../data/campuses'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { CampusFilter, Role, User } from '../../types'

/** Roles that only ever work on one campus. */
const SINGLE_CAMPUS: Role[] = ['fm_engineer', 'technician']

/** Users & roles: Admin can edit and add demo users; FM Manager can view. */
export function UsersSection() {
  const { users, technicians } = useAppState()
  const user = useCurrentUser()
  const canManage = can(user, 'users.manage')
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const sorted = [...users].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name))

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Users className="size-5 text-navy-600" aria-hidden /> Users & roles
        </span>
      }
      subtitle={canManage ? 'Change a user’s role or campus, or add a demo user. Changes apply immediately.' : 'View only for your role — the System Admin manages users.'}
      actions={
        canManage && (
          <Button size="sm" variant="teal" onClick={() => setEditing('new')}>
            <UserPlus className="size-4" aria-hidden />
            Add demo user
          </Button>
        )
      }
      flush
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-navy-50/60 text-xs font-semibold tracking-wide text-navy-500 uppercase">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Campus</th>
              <th className="px-3 py-3">Technician record</th>
              {canManage && <th className="px-5 py-3 text-right">Edit</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {sorted.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-3">
                    <UserAvatar user={u} size="sm" />
                    <span>
                      <span className="block font-medium text-navy-900">
                        {u.name} {u.id === user?.id && <Badge tone="info">You</Badge>}
                      </span>
                      <span className="block text-xs text-navy-500">{u.jobTitle}</span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-navy-700">{ROLE_LABELS[u.role]}</td>
                <td className="px-3 py-2.5 text-navy-700">{CAMPUS_FILTER_LABELS[u.campus]}</td>
                <td className="px-3 py-2.5 text-navy-600">{technicians.find((t) => t.id === u.technicianId)?.name ?? '—'}</td>
                {canManage && (
                  <td className="px-5 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(u)}
                      disabled={u.id === user?.id}
                      title={u.id === user?.id ? 'You can’t change your own role while logged in' : undefined}
                      aria-label={`Edit ${u.name}`}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <UserModal user={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}

function initialsOf(name: string): string {
  const words = name.replace(/^Dr\.?\s+/i, '').trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() || '?'
}

function UserModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const { technicians, users } = useAppState()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'fm_engineer')
  const [campus, setCampus] = useState<CampusFilter>(user?.campus ?? 'AIN')
  const [technicianId, setTechnicianId] = useState(user?.technicianId ?? '')
  const [showErrors, setShowErrors] = useState(false)

  const singleCampus = SINGLE_CAMPUS.includes(role)
  const effectiveCampus: CampusFilter = singleCampus && campus === 'ALL' ? 'AIN' : campus
  const campusTechs = technicians.filter((t) => effectiveCampus === 'ALL' || t.campus === effectiveCampus)
  const linkedElsewhere = (techId: string) => users.some((u) => u.technicianId === techId && u.id !== user?.id)
  const errors = {
    name: name.trim().length < 3 ? 'Enter a full name.' : undefined,
    technician: role === 'technician' && !campusTechs.some((t) => t.id === technicianId) ? 'Link this login to a technician on the same campus.' : undefined,
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (errors.name || errors.technician) return
    const saved: User = {
      id: user?.id ?? `u-demo-${Date.now().toString(36)}`,
      name: name.trim(),
      role,
      campus: effectiveCampus,
      initials: initialsOf(name),
      jobTitle: jobTitle.trim() || ROLE_LABELS[role],
      ...(role === 'technician' ? { technicianId } : {}),
    }
    dispatch(actions.saveUser(saved))
    toast.show(user ? `${saved.name} updated` : `${saved.name} added — available on the login screen and in Switch role`)
    onClose()
  }

  return (
    <Modal
      title={user ? `Edit ${user.name}` : 'Add demo user'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" variant="teal">
            Save
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="um-name" required error={showErrors ? errors.name : undefined}>
            <input id="um-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Job title" htmlFor="um-title" optional>
            <input id="um-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={ROLE_LABELS[role]} className={inputClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" htmlFor="um-role" required>
            <select id="um-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
              {ROLE_ORDER.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Campus" htmlFor="um-campus" required hint={singleCampus ? 'Engineers and technicians work on one campus.' : undefined}>
            <select id="um-campus" value={effectiveCampus} onChange={(e) => setCampus(e.target.value as CampusFilter)} className={inputClass}>
              {!singleCampus && <option value="ALL">Both campuses</option>}
              <option value="AIN">Al Ain</option>
              <option value="AUH">Abu Dhabi</option>
            </select>
          </Field>
        </div>
        {role === 'technician' && (
          <Field label="Technician record" htmlFor="um-tech" required error={showErrors ? errors.technician : undefined} hint="Their jobs and PPM tasks come from this record.">
            <select id="um-tech" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className={inputClass}>
              <option value="">Select a technician…</option>
              {campusTechs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.trade.toUpperCase()}
                  {linkedElsewhere(t.id) ? ' (already has a login)' : ''}
                </option>
              ))}
            </select>
          </Field>
        )}
      </form>
    </Modal>
  )
}
