import { ComingSoon } from '../../components/ui/ComingSoon'
import { PageHeader } from '../../components/ui/PageHeader'

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How it works"
        description="From the electrical panel to the dashboard."
      />
      <ComingSoon
        step={11}
        features={[
          'Selec energy meters (RS-485 / Modbus) → ESP32-S3 IoT node → SIM7080G cellular → cloud dashboard',
          'CT clamps for predictive maintenance',
          'Available add-ons',
        ]}
      />
    </>
  )
}
