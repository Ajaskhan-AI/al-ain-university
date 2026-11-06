import { format, formatDistanceToNowStrict } from 'date-fns'

/** 125 minutes → "2 h 5 min"; 50 hours → "2 d 2 h". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '—'
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy, HH:mm')
}

/** "5 minutes ago" */
export function formatAgo(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}
