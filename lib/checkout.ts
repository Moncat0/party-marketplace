import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { feeBreakdown, getOrCreateStripeCustomer, SITE_URL } from '@/lib/payments'

type BookingForCheckout = {
  id: string
  price_ore: number
  payment_status: string | null
  planner_id: string
  stripe_checkout_session_id?: string | null
  serviceTitle: string
}

/**
 * Create a platform Checkout Session (funds stay on Gigtorget until release).
 * Uses admin client for booking updates (RLS: planners cannot update booking_requests).
 */
export async function createEscrowCheckoutSession(
  booking: BookingForCheckout,
  planner: { id: string; email: string; name?: string | null }
): Promise<{ url: string; sessionId: string }> {
  const admin = createAdminClient()
  const { platformFeeOre, providerPayoutOre } = feeBreakdown(booking.price_ore)

  const customerId = await getOrCreateStripeCustomer({
    userId: planner.id,
    email: planner.email,
    name: planner.name,
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    payment_method_types: ['card'],
    currency: 'sek',
    line_items: [
      {
        price_data: {
          currency: 'sek',
          unit_amount: booking.price_ore,
          product_data: {
            name: booking.serviceTitle || 'Bokning via Gigtorget',
            description:
              'Beloppet hålls säkert av Gigtorget tills du godkänner utbetalning efter evenemanget. 20% serviceavgift ingår (täcker betalning och plattform — inte ren vinst).',
          },
        },
        quantity: 1,
      },
    ],
    // No transfer_data / application_fee here — escrow hold on platform balance.
    success_url: `${SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/payment/cancel?booking_id=${booking.id}`,
    metadata: {
      booking_id: booking.id,
      festen_planner_id: planner.id,
      price_ore: String(booking.price_ore),
      platform_fee_ore: String(platformFeeOre),
      provider_payout_ore: String(providerPayoutOre),
    },
    payment_intent_data: {
      metadata: {
        booking_id: booking.id,
        festen_planner_id: planner.id,
      },
    },
  })

  if (!session.url) {
    throw new Error('Stripe Checkout session missing url')
  }

  await admin
    .from('booking_requests')
    .update({
      stripe_checkout_session_id: session.id,
      platform_fee_ore: platformFeeOre,
      provider_payout_ore: providerPayoutOre,
    })
    .eq('id', booking.id)

  return { url: session.url, sessionId: session.id }
}
