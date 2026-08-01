export type AdminRange = '7d' | '30d' | 'all'

export function parseAdminRange(raw: string | undefined | null): AdminRange {
  if (raw === '30d' || raw === 'all') return raw
  return '7d'
}

export function rangeLabel(range: AdminRange): string {
  if (range === '7d') return '7 dagar'
  if (range === '30d') return '30 dagar'
  return 'Alla tider'
}

/** Inclusive window for the selected period + matching previous window for deltas. */
export function rangeWindows(range: AdminRange): {
  start: Date | null
  end: Date
  prevStart: Date | null
  prevEnd: Date | null
  days: number | null
} {
  const end = new Date()
  if (range === 'all') {
    return { start: null, end, prevStart: null, prevEnd: null, days: null }
  }
  const days = range === '7d' ? 7 : 30
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  const prevEnd = new Date(start)
  const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)
  return { start, end, prevStart, prevEnd, days }
}

export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export function formatPct(value: number | null, digits = 0): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return (numerator / denominator) * 100
}

/** PostHog app URL for deep links (not the ingest host). */
export function posthogAppUrl(): string {
  const override = process.env.NEXT_PUBLIC_POSTHOG_APP_URL?.trim()
  if (override) return override.replace(/\/$/, '')
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? ''
  if (host.includes('eu')) return 'https://eu.posthog.com'
  return 'https://app.posthog.com'
}
