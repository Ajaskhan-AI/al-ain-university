import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function ComplaintsPage() {
  return (
    <>
      <PageHeader
        title="Complaints & Work Orders"
        description="Room QR complaints through to assigned, in-progress and closed work orders."
      />
      <ComingSoon
        step={4}
        features={[
          'Public complaint form from a room QR code',
          'Assign technician, status flow and timeline',
          'Response / resolution time and repeat-fault rooms',
        ]}
      />
    </>
  )
}
