import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function SmdbPage() {
  return (
    <>
      <PageHeader
        title="SMDB Live Monitoring"
        description="Sub-main distribution boards: live load, voltage, current and status per building."
      />
      <ComingSoon
        step={7}
        features={[
          'Live readings updated every few seconds',
          'Building → SMDB drill-down with gauges and 24h trend',
          'Alerts center: acknowledge, add note, create work order',
        ]}
      />
    </>
  )
}
