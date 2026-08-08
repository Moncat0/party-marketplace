import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { createEscrowCheckoutSession } from '@/lib/checkout'
import { isPayableStatus } from '@/lib/payments'
import { trackServer } from '@/lib/track-server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId } = await request.json()
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

  const { data: booking } = await supabase
    .from('booking_requests')
    .select(
      `
      id, status, payment_status, price_ore, planner_id, stripe_checkout_session_id,
      services!service_id(
        title, provider_profiles(id, stripe_account_id, stripe_onboarded)
      )
    `
    )
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.planner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.status !== 'accepted' && booking.status !== 'completed') {
    return NextResponse.json({ error: 'Booking is not accepted' }, { status: 400 })
  }
  if (!isPayableStatus(booking.payment_status)) {
    return NextResponse.json({ error: 'Already paid or not payable' }, { status: 400 })
  }
  if (!booking.price_ore) {
    return NextResponse.json({ error: 'No price set on this booking' }, { status: 400 })
  }

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
    return NextResponse.json(
      {
        error:
          'Talangen har inte kopplat sitt bankkonto ännu. Be dem logga in och ansluta Stripe.',
      },
      { status: 400 }
    )
  }

  const { data: plannerRow } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  try {
    const { url, sessionId } = await createEscrowCheckoutSession(
      {
        id: booking.id,
        price_ore: booking.price_ore,
        payment_status: booking.payment_status,
        planner_id: booking.planner_id,
        stripe_checkout_session_id: booking.stripe_checkout_session_id,
        serviceTitle: service?.title ?? 'Bokning via Festly',
      },
      { id: user.id, email: user.email, name: plannerRow?.name }
    )

    await trackServer(
      'checkout_started',
      { booking_id: booking.id, session_id: sessionId, price_ore: booking.price_ore },
      user.id
    )

    return NextResponse.json({ url })
  } catch (e) {
    console.error('checkout failed', e)
    return NextResponse.json({ error: 'Kunde inte starta betalning' }, { status: 500 })
  }
}
