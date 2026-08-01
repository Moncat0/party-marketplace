import {
  getCancellationPolicy,
  refundFractionForCancel,
  type CancellationPolicyId,
} from '@/lib/cancellation-policies'
import { cancellationPolicyIdFromStored } from '@/lib/quotes'
import { isFundsHeld } from '@/lib/payment-status'

export type CancelRole = 'planner' | 'provider'

export function resolveBookingCancellationPolicyId(opts: {
  acceptedQuotePolicy: string | null | undefined
  /** @deprecated Policy lives on the quote/booking, not the service listing. */
  servicePolicy?: string | null | undefined
}): CancellationPolicyId {
  return cancellationPolicyIdFromStored(opts.acceptedQuotePolicy) ?? 'moderate'
}

/** Expected refund in öre for a cancel at `now`. */
export function expectedRefundOre(opts: {
  role: CancelRole
  priceOre: number | null | undefined
  paymentStatus: string | null | undefined
  eventDate: string | null | undefined
  policyId: CancellationPolicyId
  now?: Date
}): number {
  const price = opts.priceOre ?? 0
  if (price <= 0 || !isFundsHeld(opts.paymentStatus)) return 0

  if (opts.role === 'provider') {
    return price
  }

  const fraction = refundFractionForCancel(opts.policyId, opts.eventDate, opts.now)
  return Math.round(price * fraction)
}

export function cancelRefundPaymentStatus(
  refundOre: number,
  priceOre: number | null | undefined
): 'refunded' | 'partially_refunded' | null {
  if (refundOre <= 0) return null
  const price = priceOre ?? 0
  if (price > 0 && refundOre >= price) return 'refunded'
  return 'partially_refunded'
}

export function cancelPolicyDetail(policyId: CancellationPolicyId): string {
  return getCancellationPolicy(policyId)?.detail ?? ''
}
