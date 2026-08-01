import {
  CANCELLATION_POLICIES,
  getCancellationPolicy,
  isCancellationPolicyId,
  type CancellationPolicyId,
} from '@/lib/cancellation-policies'

export type QuoteStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'

export type QuoteRecord = {
  id: string
  price_ore: number
  description: string | null
  duration: string | null
  event_date: string | null
  location: string | null
  cancellation_policy: string | null
  status: QuoteStatus
}

/** Resolve stored quote policy text (detail or id) back to a preset id. */
export function cancellationPolicyIdFromStored(
  stored: string | null | undefined
): CancellationPolicyId | null {
  if (!stored) return null
  if (isCancellationPolicyId(stored)) return stored
  const byDetail = CANCELLATION_POLICIES.find(p => p.detail === stored)
  return byDetail?.id ?? null
}

/** Short summary label for a stored policy value. */
export function cancellationPolicySummary(stored: string | null | undefined): string | null {
  const id = cancellationPolicyIdFromStored(stored)
  if (id) return getCancellationPolicy(id)?.short ?? null
  return stored ?? null
}

type LockedBookingFields = {
  event_date: string | null
  event_location: string | null
}

/** Reject when client tries to override planner-filled booking fields. */
export function validateQuoteLockedFields(
  booking: LockedBookingFields,
  client: { event_date?: unknown; location?: unknown }
): { ok: true; event_date: string | null; location: string | null } | { ok: false; error: string } {
  const lockedDate = booking.event_date ?? null
  const lockedLocation = booking.event_location ?? null

  if (
    client.event_date !== undefined &&
    client.event_date !== null &&
    String(client.event_date) !== String(lockedDate ?? '')
  ) {
    return { ok: false, error: 'Datum kan inte ändras i offerten.' }
  }
  if (
    client.location !== undefined &&
    client.location !== null &&
    String(client.location).trim() !== String(lockedLocation ?? '').trim()
  ) {
    return { ok: false, error: 'Plats kan inte ändras i offerten.' }
  }

  return { ok: true, event_date: lockedDate, location: lockedLocation }
}
