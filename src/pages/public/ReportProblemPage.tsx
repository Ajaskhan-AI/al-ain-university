import { useParams } from 'react-router'
import { SampleBadge } from '../../components/layout/SampleBadge'
import { ComingSoon } from '../../components/ui/ComingSoon'

/** Public page opened from a room QR code (no login). Built in step 4. */
export default function ReportProblemPage() {
  const { roomId } = useParams()
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-base font-bold text-navy-900">
          Al Ain University <span className="font-medium text-navy-400">· Report a problem</span>
        </p>
        <SampleBadge className="mt-2" />
        <h1 className="mt-6 text-2xl font-bold text-navy-900">Room {roomId}</h1>
        <div className="mt-4">
          <ComingSoon
            step={4}
            features={['Room auto-filled from the QR code', 'Pick category, describe, optional photo', 'Get a ticket number']}
          />
        </div>
      </div>
    </div>
  )
}
