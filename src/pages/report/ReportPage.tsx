import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function ReportPage() {
  return (
    <>
      <PageHeader
        title="Monthly FM & Energy Report"
        description="Generate a PDF report for a chosen month and campus."
      />
      <ComingSoon
        step={6}
        features={[
          'Pick month and campus, then Download PDF',
          'PPM, complaints, energy, indicative Scope 2 CO₂, alerts',
          'Single ticket and asset-history PDFs',
        ]}
      />
    </>
  )
}
