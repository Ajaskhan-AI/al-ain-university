import { ComingSoon } from '../../components/ui/ComingSoon'
import { useCurrentUser } from '../../auth/useCurrentUser'

export default function MyJobsPage() {
  const user = useCurrentUser()
  return (
    <>
      <h1 className="text-2xl font-bold text-navy-900">My Jobs</h1>
      <p className="mt-1 mb-5 text-navy-500">
        Work orders and PPM tasks assigned to {user?.name ?? 'you'}.
      </p>
      <ComingSoon
        step={4}
        features={[
          'Assigned work orders: start, complete with remark and photo (step 4)',
          'Assigned PPM tasks with checklists (step 5)',
        ]}
      />
    </>
  )
}
