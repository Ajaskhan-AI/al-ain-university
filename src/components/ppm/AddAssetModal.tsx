import { useState, type FormEvent } from 'react'
import { BUILDINGS, getBuilding } from '../../data/buildings'
import { filterByCampus } from '../../lib/campus'
import { ASSET_CATEGORIES, ASSET_CATEGORY_LABELS, DEFAULT_TRADE, nextAssetTag } from '../../lib/ppm'
import { actions } from '../../store/actions'
import { useAppDispatch, useAppState } from '../../store/hooks'
import type { AssetCategory, Trade } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { inputClass } from '../ui/styles'

const TRADES: Trade[] = ['hvac', 'electrical', 'plumbing', 'general']

/** Register a new plant asset; its QR tag ID is generated automatically. */
export function AddAssetModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { assets, campus } = useAppState()
  const dispatch = useAppDispatch()
  const buildings = filterByCampus(BUILDINGS, campus)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('ahu')
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? '')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [installYear, setInstallYear] = useState(String(new Date().getFullYear()))
  const [trade, setTrade] = useState<Trade>(DEFAULT_TRADE.ahu)
  const [showErrors, setShowErrors] = useState(false)

  const building = getBuilding(buildingId)
  const tag = building ? nextAssetTag(assets, building.campus, category) : '—'
  const year = Number(installYear)
  const yearValid = Number.isInteger(year) && year >= 1980 && year <= new Date().getFullYear()
  const valid = !!building && name.trim().length >= 2 && location.trim().length >= 2 && yearValid

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (!valid || !building) return
    dispatch(
      actions.createAsset({
        id: tag,
        name: name.trim(),
        category,
        campus: building.campus,
        buildingId: building.id,
        location: location.trim(),
        description: description.trim() || ASSET_CATEGORY_LABELS[category],
        installYear: year,
        trade,
        monitored: false,
      }),
    )
    onCreated(tag)
  }

  return (
    <Modal
      title="Add asset"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-asset-form" variant="teal">
            Add asset
          </Button>
        </>
      }
    >
      <form id="add-asset-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          QR tag ID: <span className="font-mono font-semibold">{tag}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="aa-cat" required>
            <select
              id="aa-cat"
              value={category}
              onChange={(e) => {
                const value = e.target.value as AssetCategory
                setCategory(value)
                setTrade(DEFAULT_TRADE[value])
              }}
              className={inputClass}
            >
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ASSET_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Building" htmlFor="aa-building" required>
            <select id="aa-building" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={inputClass}>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Asset name" htmlFor="aa-name" required error={showErrors && name.trim().length < 2 ? 'Enter a name.' : undefined}>
          <input id="aa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AHU-06 Library annex" className={inputClass} />
        </Field>
        <Field label="Location" htmlFor="aa-loc" required error={showErrors && location.trim().length < 2 ? 'Enter a location.' : undefined}>
          <input id="aa-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Roof plant room" className={inputClass} />
        </Field>
        <Field label="Description" htmlFor="aa-desc" optional>
          <input id="aa-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Air handling unit, 8,000 L/s" className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Install year" htmlFor="aa-year" required error={showErrors && !yearValid ? 'Enter a valid year.' : undefined}>
            <input id="aa-year" type="number" inputMode="numeric" value={installYear} onChange={(e) => setInstallYear(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Maintained by" htmlFor="aa-trade" required>
            <select id="aa-trade" value={trade} onChange={(e) => setTrade(e.target.value as Trade)} className={inputClass}>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}
