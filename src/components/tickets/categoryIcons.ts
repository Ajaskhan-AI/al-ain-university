import { Droplets, Lightbulb, Snowflake, SprayCan, Wrench, Zap, type LucideIcon } from 'lucide-react'
import type { TicketCategory } from '../../types'

export const CATEGORY_ICONS: Record<TicketCategory, LucideIcon> = {
  ac: Snowflake,
  lighting: Lightbulb,
  plumbing: Droplets,
  cleaning: SprayCan,
  other: Wrench,
  electrical: Zap,
}
