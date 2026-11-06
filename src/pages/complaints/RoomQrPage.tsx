import { ArrowLeft, ExternalLink, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { BUILDINGS } from '../../data/buildings'
import { filterByCampus } from '../../lib/campus'
import { useAppState } from '../../store/hooks'

/** Full link a phone opens when it scans the room's QR code. */
function reportUrl(roomId: string): string {
  return `${window.location.origin}${window.location.pathname}#/report/${roomId}`
}

/** Printable QR labels — one per room — that open the public complaint form. */
export default function RoomQrPage() {
  const { rooms, campus } = useAppState()
  const buildings = filterByCampus(BUILDINGS, campus)

  return (
    <>
      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800 print:hidden">
        <ArrowLeft className="size-4" aria-hidden />
        All complaints
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Room QR codes"
          description="Stick one in each room. Scanning it opens the complaint form with the room already filled in — no app or login needed."
          actions={
            <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
              <Printer className="size-4" aria-hidden />
              Print labels
            </Button>
          }
        />
      </div>

      <div className="space-y-8">
        {buildings.map((building) => (
          <section key={building.id} className="break-inside-avoid">
            <h2 className="mb-3 text-lg font-semibold text-navy-900">
              {building.name} <span className="text-sm font-normal text-navy-400">· {building.id}</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rooms
                .filter((r) => r.buildingId === building.id)
                .map((room) => (
                  <div key={room.id} className="flex flex-col items-center rounded-xl border border-navy-100 bg-white p-4 text-center shadow-sm break-inside-avoid">
                    <QRCodeSVG value={reportUrl(room.id)} size={128} level="M" marginSize={1} />
                    <p className="mt-3 font-semibold text-navy-900">{room.name}</p>
                    <p className="text-sm text-navy-500">{room.id}</p>
                    <p className="mt-1 text-xs text-navy-400">Scan to report a problem</p>
                    <Link
                      to={`/report/${room.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline print:hidden"
                    >
                      Open form
                      <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
