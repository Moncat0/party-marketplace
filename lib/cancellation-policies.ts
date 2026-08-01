export type CancellationPolicyId = 'flexible' | 'moderate' | 'strict'

export type CancellationPolicy = {
  id: CancellationPolicyId
  label: string
  short: string
  detail: string
}

/**
 * Airbnb-style presets. Percentages are of the total quote (planner-paid amount).
 * Cutoffs are relative to event start (local calendar day of event_date).
 */
export const CANCELLATION_POLICIES: CancellationPolicy[] = [
  {
    id: 'flexible',
    label: 'Flexibel',
    short: 'Full återbetalning fram till 24 timmar före evenemanget.',
    detail:
      'Avbokning minst 24 timmar före evenemangets datum: 100% återbetalning. Senare: ingen återbetalning.',
  },
  {
    id: 'moderate',
    label: 'Måttlig',
    short: 'Full återbetalning fram till 5 dagar före; därefter 50%.',
    detail:
      'Avbokning minst 5 dagar före: 100% återbetalning. 1–4 dagar före: 50%. Mindre än 24 timmar före: ingen återbetalning.',
  },
  {
    id: 'strict',
    label: 'Strikt',
    short: '50% återbetalning fram till 7 dagar före; därefter ingen.',
    detail:
      'Avbokning minst 7 dagar före: 50% återbetalning. Senare: ingen återbetalning.',
  },
]

export function getCancellationPolicy(id: string | null | undefined): CancellationPolicy | null {
  if (!id) return null
  return CANCELLATION_POLICIES.find(p => p.id === id) ?? null
}

export function isCancellationPolicyId(value: unknown): value is CancellationPolicyId {
  return value === 'flexible' || value === 'moderate' || value === 'strict'
}

/** Refund fraction 0–1 for a planner cancel at `now`, given event date (YYYY-MM-DD). */
export function refundFractionForCancel(
  policyId: CancellationPolicyId,
  eventDate: string | null | undefined,
  now = new Date()
): number {
  if (!eventDate) return 0
  const event = new Date(`${eventDate}T23:59:59`)
  const ms = event.getTime() - now.getTime()
  const hours = ms / (1000 * 60 * 60)
  const days = hours / 24

  switch (policyId) {
    case 'flexible':
      return hours >= 24 ? 1 : 0
    case 'moderate':
      if (days >= 5) return 1
      if (hours >= 24) return 0.5
      return 0
    case 'strict':
      return days >= 7 ? 0.5 : 0
    default:
      return 0
  }
}
