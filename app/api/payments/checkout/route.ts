import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, applicationFee } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId } = await request.json()
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

  // Fetch booking with provider info
  const { data: booking } = await supabase
    .from('booking_requests')
    .select(`
      id, status, payment_status, price_ore, planner_id,
      services!service_id(
        title, provider_profiles(id, stripe_account_id, stripe_onboarded)
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.planner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.status !== 'accepted') return NextResponse.json({ error: 'Booking is not accepted' }, { status: 400 })
  if (booking.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  if (!booking.price_ore) return NextResponse.json({ error: 'No price set on this booking' }, { status: 400 })

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    title: string | null
    provider_profiles:
      | { id: string; stripe_account_id: string | null; stripe_onboarded: boolean }
      | { id: string; stripe_account_id: string | null; stripe_onboarded: boolean }[]
      | null
  } | null
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null

  if (!profile?.stripe_account_id || !profile?.stripe_onboarded) {
    return NextResponse.json({ error: 'Talangen har inte kopplat sitt bankkonto ännu. Be dem logga in och ansluta Stripe.' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3004'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    currency: 'sek',
    line_items: [
      {
        price_data: {
          currency: 'sek',
          unit_amount: booking.price_ore,
          product_data: {
            name: service?.title ?? 'Bokning via FESTEN.',
            description: 'Betalning hanteras säkert av FESTEN. — 20% serviceavgift ingår.',
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFee(booking.price_ore),
      transfer_data: { destination: profile.stripe_account_id },
    },
    success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/payment/cancel`,
    metadata: { booking_id: bookingId },
  })

  // Store session ID so the webhook can match it
  await supabase.from('booking_requests')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', bookingId)

  return NextResponse.json({ url: session.url })
}
