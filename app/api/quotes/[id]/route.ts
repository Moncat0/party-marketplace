import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createEscrowCheckoutSession } from '@/lib/checkout'
import { feeBreakdown } from '@/lib/payments'
import { trackServer } from '@/lib/track-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  if (!['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: quote } = await supabase
    .from('quotes')
    .select(
      `
      *,
      booking_requests!booking_request_id(
        id, planner_id, status, payment_status,
        services!service_id(
          title,
          provider_profiles(stripe_account_id, stripe_onboarded)
        )
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const booking = (
    Array.isArray(quote.booking_requests) ? quote.booking_requests[0] : quote.booking_requests
  ) as {
    id: string
    planner_id: string
    status: string
    payment_status: string | null
    services:
      | {
          title: string | null
          provider_profiles:
            | { stripe_account_id: string | null; stripe_onboarded: boolean }
            | { stripe_account_id: string | null; stripe_onboarded: boolean }[]
            | null
        }
      | {
          title: string | null
          provider_profiles:
            | { stripe_account_id: string | null; stripe_onboarded: boolean }
            | { stripe_account_id: string | null; stripe_onboarded: boolean }[]
            | null
        }[]
      | null
  } | null

  if (booking?.planner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (quote.status !== 'pending') {
    return NextResponse.json({ error: 'Quote already responded to' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (status !== 'accepted' || !booking) {
    await admin.from('quotes').update({ status }).eq('id', params.id)
    await trackServer('quote_declined', { quote_id: params.id, booking_id: booking?.id }, user.id)
    return NextResponse.json({ ok: true })
  }

  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null

  if (!profile?.stripe_account_id || !profile.stripe_onboarded) {
    return NextResponse.json(
      {
        error:
          'Talangen har inte kopplat utbetalningar ännu. Offerten kan inte accepteras förrän de är klara.',
        code: 'stripe_required',
      },
      { status: 400 }
    )
  }

  const { platformFeeOre, providerPayoutOre } = feeBreakdown(quote.price_ore)

  const { error: quoteErr } = await admin
    .from('quotes')
    .update({ status: 'accepted' })
    .eq('id', params.id)
  if (quoteErr) {
    return NextResponse.json({ error: 'Kunde inte uppdatera offerten' }, { status: 500 })
  }

  const { error: bookingErr } = await admin
    .from('booking_requests')
    .update({
      price_ore: quote.price_ore,
      payment_status: 'unpaid',
      platform_fee_ore: platformFeeOre,
      provider_payout_ore: providerPayoutOre,
    })
    .eq('id', booking.id)

  if (bookingErr) {
    console.error('quote accept booking update failed', bookingErr)
    return NextResponse.json({ error: 'Kunde inte uppdatera bokningen' }, { status: 500 })
  }

  const { data: plannerRow } = await admin
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  try {
    const { url, sessionId } = await createEscrowCheckoutSession(
      {
        id: booking.id,
        price_ore: quote.price_ore,
        payment_status: 'unpaid',
        planner_id: booking.planner_id,
        serviceTitle: service?.title ?? 'Bokning via FESTEN',
      },
      { id: user.id, email: user.email, name: plannerRow?.name }
    )

    await trackServer(
      'quote_accepted',
      {
        quote_id: params.id,
        booking_id: booking.id,
        price_ore: quote.price_ore,
        session_id: sessionId,
      },
      user.id
    )
    await trackServer(
      'checkout_started',
      { booking_id: booking.id, session_id: sessionId, price_ore: quote.price_ore },
      user.id
    )

    return NextResponse.json({ ok: true, checkoutUrl: url })
  } catch (e) {
    console.error('quote accept checkout failed', e)
    // Quote accepted + unpaid — planner can pay later via PayButton
    return NextResponse.json({
      ok: true,
      checkoutUrl: null,
      warning: 'Offerten accepterades men betalningen kunde inte startas. Betala under Mina bokningar.',
    })
  }
}
