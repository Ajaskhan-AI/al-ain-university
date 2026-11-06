import { useEffect, useState } from 'react'

/** Current time that refreshes every `intervalMs`, so countdowns (SLA, "5 min ago") stay live. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
