import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function PredictivePage() {
  return (
    <>
      <PageHeader
        title="Predictive Maintenance"
        description="Health of chillers, AHUs and pumps from motor current signatures."
      />
      <ComingSoon
        step={8}
        features={[
          'Health score 0–100 with OK / Watch / Alert status',
          'Current trend vs. normal band, detected issue, recommended action',
          'Schedule maintenance or create a work order',
        ]}
      />
    </>
  )
}
