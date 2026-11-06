import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function PpmPage() {
  return (
    <>
      <PageHeader
        title="Digital Logbook & PPM"
        description="Asset register with QR tags, planned preventive maintenance and checklists."
      />
      <ComingSoon
        step={5}
        features={[
          'Asset list with QR tag IDs and scan-QR screen',
          'Checklists with readings, remarks and photo',
          'PPM calendar: due / overdue / done, completion %',
        ]}
      />
    </>
  )
}
