import { can } from '../../auth/permissions'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function SettingsPage() {
  const user = useCurrentUser()
  // Only list the settings areas this role can use.
  const features = [
    can(user, 'smdb.editThresholds') && 'SMDB alarm thresholds per board (step 7)',
    can(user, 'smdb.simulateFault') && 'Demo helper: simulate a trip or overload (step 7)',
    (can(user, 'users.view') || can(user, 'users.manage')) &&
      `Users & roles — ${can(user, 'users.manage') ? 'edit' : 'view only'} (step 11)`,
    can(user, 'demo.reset') && 'Reset demo data',
  ].filter((f): f is string => typeof f === 'string')

  return (
    <>
      <PageHeader title="Settings" description="Thresholds, demo tools and user management." />
      <ComingSoon step={7} features={features} />
    </>
  )
}
