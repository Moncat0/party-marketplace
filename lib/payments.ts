import { createAdminClient } from '@/lib/supabase-admin'
import { applicationFee, providerPayout, stripe } from '@/lib/stripe'

export {
  PAYMENT_STATUSES,
  type PaymentStatus,
  isPayableStatus,
  isFundsHeld,
  paymentStatusLabelSv,
} from '@/lib/payment-status'

/** Resolve or create Stripe Customer; persist id on users. */
export async function getOrCreateStripeCustomer(opts: {
  userId: string
  email: string
  name?: string | null
}): Promise<string> {
  const admin = createAdminClient()
  const { data: row } = await admin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', opts.userId)
    .single()

  if (row?.stripe_customer_id) {
    return row.stripe_customer_id
  }

  const existing = await stripe.customers.list({ email: opts.email, limit: 1 })
  let customerId = existing.data[0]?.id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: opts.email,
      name: opts.name ?? undefined,
      metadata: { festen_user_id: opts.userId },
    })
    customerId = customer.id
  }

  await admin
    .from('users')
    .update({ stripe_customer_id: customerId })
    .eq('id', opts.userId)

  return customerId
}

export function feeBreakdown(priceOre: number) {
  const platformFeeOre = applicationFee(priceOre)
  const providerPayoutOre = providerPayout(priceOre)
  return { platformFeeOre, providerPayoutOre }
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
