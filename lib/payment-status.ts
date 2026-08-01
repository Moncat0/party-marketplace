/** Client-safe payment status helpers (no Stripe / server secrets). */

export const PAYMENT_STATUSES = [
  'unpaid',
  'held',
  'pending_release',
  'released',
  'refunded',
  'partially_refunded',
  'disputed',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export function isPayableStatus(status: string | null | undefined): boolean {
  return status === 'unpaid'
}

export function isFundsHeld(status: string | null | undefined): boolean {
  return status === 'held' || status === 'pending_release'
}

export function paymentStatusLabelSv(status: string | null | undefined): string {
  switch (status) {
    case 'unpaid':
      return 'Väntar på betalning'
    case 'held':
      return 'Betald (hålls av FESTEN)'
    case 'pending_release':
      return 'Väntar på utbetalning'
    case 'released':
      return 'Utbetald'
    case 'refunded':
      return 'Återbetald'
    case 'partially_refunded':
      return 'Delvis återbetald'
    case 'disputed':
      return 'Tvist'
    default:
      return status ?? '—'
  }
}
