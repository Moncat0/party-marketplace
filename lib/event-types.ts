/**
 * Booking occasion — what party the planner is throwing.
 * Orthogonal to service browse categories (what the talent offers).
 * Note: Bröllop / Barnkalas also exist as browse categories for specialists.
 */

export const EVENT_TYPES = [
  { value: 'birthday', label: 'Födelsedag' },
  { value: 'wedding', label: 'Bröllop' },
  { value: 'corporate', label: 'Företagsevent' },
  { value: 'kids', label: 'Barnkalas' },
  { value: 'other', label: 'Annat' },
] as const

export type EventTypeValue = (typeof EVENT_TYPES)[number]['value']

const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map(e => [e.value, e.label])
)

export function formatEventType(value: string | null | undefined): string | null {
  if (!value) return null
  return LABEL_BY_VALUE[value] ?? value
}
