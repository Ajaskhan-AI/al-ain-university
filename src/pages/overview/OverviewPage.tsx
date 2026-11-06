import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Live KPIs across both campuses — alerts, tickets, PPM and energy."
      />
      <ComingSoon
        step={10}
        features={[
          'Active alerts, open tickets, PPM completion %, today’s kWh, CO₂ this month',
          'Mini charts calculated live from the store',
          'Each KPI card links to its module',
        ]}
      />
    </>
  )
}
