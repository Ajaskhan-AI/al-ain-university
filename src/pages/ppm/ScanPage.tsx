import { ChevronRight, ScanQrCode, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ASSET_ICONS } from '../../components/ppm/assetIcons'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { inputClass } from '../../components/ui/styles'
import { getBuilding } from '../../data/buildings'
import { filterByCampus } from '../../lib/campus'
import { useAppState } from '../../store/hooks'

/**
 * "Scan QR": every asset has a QR tag that opens its page. On a phone the
 * camera app reads the tag directly; here the tag can also be typed or picked.
 */
export default function ScanPage() {
  const { assets, campus } = useAppState()
  const navigate = useNavigate()
  const [tag, setTag] = useState('')
  const [error, setError] = useState<string | null>(null)

  const campusAssets = filterByCampus(assets, campus)
  const query = tag.trim().toUpperCase()
  const matches = query ? campusAssets.filter((a) => a.id.includes(query) || a.name.toUpperCase().includes(query)) : campusAssets

  const open = (event: FormEvent) => {
    event.preventDefault()
    const exact = campusAssets.find((a) => a.id === query)
    if (exact) navigate(`/ppm/assets/${exact.id}`)
    else if (matches.length === 1) navigate(`/ppm/assets/${matches[0].id}`)
    else setError(query ? `No asset with tag “${query}” on this campus.` : 'Type a tag ID, e.g. AAU-AIN-AHU-03.')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <ScanQrCode className="size-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Scan asset QR</h1>
          <p className="text-navy-500">
            Point the phone camera at the QR tag on the equipment — it opens the asset’s checklist and history. Or enter the tag ID below.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={open} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="tag" className="sr-only">
            Tag ID
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-navy-400" aria-hidden />
            <input
              id="tag"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value)
                setError(null)
              }}
              placeholder="AAU-AIN-AHU-03"
              autoCapitalize="characters"
              autoComplete="off"
              className={`${inputClass} py-3 pl-10 font-mono text-lg uppercase`}
            />
          </div>
          <Button type="submit" variant="teal" size="lg">
            Open asset
          </Button>
        </form>
        {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
      </Card>

      <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-navy-500 uppercase">
        {query ? `${matches.length} matching assets` : 'Or pick from the list'}
      </h2>
      <ul className="space-y-2">
        {matches.map((asset) => {
          const Icon = ASSET_ICONS[asset.category]
          return (
            <li key={asset.id}>
              <Link to={`/ppm/assets/${asset.id}`} className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3 shadow-sm hover:border-teal-300">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm font-semibold text-navy-900">{asset.id}</span>
                  <span className="block truncate text-sm text-navy-500">
                    {asset.name} · {getBuilding(asset.buildingId)?.shortName} · {asset.location}
                  </span>
                </span>
                <ChevronRight className="size-5 text-navy-300" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
