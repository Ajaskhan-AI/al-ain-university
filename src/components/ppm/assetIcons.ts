import { Fan, Power, Snowflake, Waves, Zap, type LucideIcon } from 'lucide-react'
import type { AssetCategory } from '../../types'

export const ASSET_ICONS: Record<AssetCategory, LucideIcon> = {
  chiller: Snowflake,
  ahu: Fan,
  pump: Waves,
  generator: Power,
  smdb: Zap,
}
