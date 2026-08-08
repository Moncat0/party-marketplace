import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPaymentHeldReceipt } from '@/lib/resend'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? '')
      .trim()
      .replace(/^['"]|['"]$/g, '')
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutCompleted(session)
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    await handleAccountUpdated(account)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id
  if (!bookingId) {
    console.error('checkout.session.completed missing booking_id metadata')
    return
  }

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('booking_requests')
    .select(
      `
      id, price_ore, payment_status, planner_id, event_date,
      users!planner_id(email, name, first_name),
      services!service_id(
        title,
        provider_profiles(users(name, preferred_name, first_name))
      )
    `
    )
    .eq('id', bookingId)
    .single()

  if (!booking) {
    console.error(`Webhook: booking ${bookingId} not found`)
    return
  }

  // Idempotent: already held or further along
  if (
    booking.payment_status === 'held' ||
    booking.payment_status === 'pending_release' ||
    booking.payment_status === 'released'
  ) {
    console.log(`Webhook: booking ${bookingId} already ${booking.payment_status}`)
    return
  }

  const expectedOre = booking.price_ore
  const paidOre = session.amount_total
  if (expectedOre == null || paidOre == null || paidOre !== expectedOre) {
    console.error(
      `Webhook amount mismatch booking=${bookingId} expected=${expectedOre} paid=${paidOre}`
    )
    await admin.from('tracking_events').insert({
      user_id: booking.planner_id,
      event_name: 'payment_amount_mismatch',
      properties: {
        booking_id: bookingId,
        expected_ore: expectedOre,
        paid_ore: paidOre,
        session_id: session.id,
      },
    })
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const now = new Date().toISOString()
  const { error } = await admin
    .from('booking_requests')
    .update({
      payment_status: 'held',
      paid_at: now,
      held_at: now,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
    })
    .eq('id', bookingId)
    .eq('payment_status', 'unpaid')

  if (error) {
    console.error('Webhook update failed', error)
    return
  }

  await admin.from('tracking_events').insert({
    user_id: booking.planner_id,
    event_name: 'payment_held',
    properties: {
      booking_id: bookingId,
      price_ore: expectedOre,
      session_id: session.id,
    },
  })

  try {
    const planner = (
      Array.isArray(booking.users) ? booking.users[0] : booking.users
    ) as { email: string | null; name: string | null; first_name: string | null } | null
    const service = (
      Array.isArray(booking.services) ? booking.services[0] : booking.services
    ) as {
      title: string | null
      provider_profiles:
        | {
            users:
              | { name: string | null; preferred_name: string | null; first_name: string | null }
              | { name: string | null; preferred_name: string | null; first_name: string | null }[]
              | null
          }
        | {
            users:
              | { name: string | null; preferred_name: string | null; first_name: string | null }
              | { name: string | null; preferred_name: string | null; first_name: string | null }[]
              | null
          }[]
        | null
    } | null
    const profile = service?.provider_profiles
      ? Array.isArray(service.provider_profiles)
        ? service.provider_profiles[0]
        : service.provider_profiles
      : null
    const providerUser = profile?.users
      ? Array.isArray(profile.users)
        ? profile.users[0]
        : profile.users
      : null
    const providerName =
      providerUser?.preferred_name ||
      providerUser?.first_name ||
      providerUser?.name ||
      'Talangen'

    if (planner?.email) {
      await sendPaymentHeldReceipt({
        to: planner.email,
        plannerName: planner.first_name || planner.name || 'du',
        serviceTitle: service?.title || 'Bokning via Festly',
        providerName,
        bookingId,
        priceOre: expectedOre,
        eventDate: booking.event_date,
        stripePaymentIntentId: paymentIntentId,
        stripeSessionId: session.id,
      })
    }
  } catch (emailErr) {
    console.error('Payment held receipt email failed', emailErr)
  }

  console.log(`Escrow held for booking ${bookingId}`)
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return
  const admin = createAdminClient()
  const onboarded =
    !!account.details_submitted &&
    !!account.charges_enabled &&
    !(account.requirements?.currently_due?.length)

  await admin
    .from('provider_profiles')
    .update({ stripe_onboarded: onboarded })
    .eq('stripe_account_id', account.id)
}
