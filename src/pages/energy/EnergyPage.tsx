import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function EnergyPage() {
  return (
    <>
      <PageHeader
        title="Academic-Calendar Energy Analytics"
        description="Energy use compared against teaching, exams, weekends, Ramadan and summer break."
      />
      <ComingSoon
        step={9}
        features={[
          'Energy chart with academic-period bands',
          'Waste detection: high use when occupancy is low',
          'Editable calendar and CSV export',
        ]}
      />
    </>
  )
}
