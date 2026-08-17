import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createEscrowCheckoutSession } from '@/lib/checkout'
import { feeBreakdown } from '@/lib/payments'
import { getCancellationPolicy, isCancellationPolicyId } from '@/lib/cancellation-policies'
import { validateQuoteLockedFields } from '@/lib/quotes'
import { trackServer } from '@/lib/track-server'

type QuoteBooking = {
  id: string
  planner_id: string
  status: string
  payment_status: string | null
  event_date: string | null
  event_location: string | null
  services:
    | {
        title: string | null
        cancellation_policy: string | null
        provider_profiles:
          | { user_id: string; stripe_account_id: string | null; stripe_onboarded: boolean }
          | { user_id: string; stripe_account_id: string | null; stripe_onboarded: boolean }[]
          | null
      }
    | {
        title: string | null
        cancellation_policy: string | null
        provider_profiles:
          | { user_id: string; stripe_account_id: string | null; stripe_onboarded: boolean }
          | { user_id: string; stripe_account_id: string | null; stripe_onboarded: boolean }[]
          | null
      }[]
    | null
}

function unwrapBooking(raw: unknown): QuoteBooking | null {
  if (!raw) return null
  return (Array.isArray(raw) ? raw[0] : raw) as QuoteBooking
}

function unwrapProviderUserId(booking: QuoteBooking): string | null {
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
  return profile?.user_id ?? null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    status,
    price_sek,
    description,
    duration,
    event_date,
    location,
    cancellation_policy,
  } = body

  const { data: quote } = await supabase
    .from('quotes')
    .select(
      `
      *,
      booking_requests!booking_request_id(
        id, planner_id, status, payment_status, event_date, event_location,
        services!service_id(
          title,
          cancellation_policy,
          provider_profiles(user_id, stripe_account_id, stripe_onboarded)
        )
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const booking = unwrapBooking(quote.booking_requests)
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const providerUserId = unwrapProviderUserId(booking)
  const isPlanner = booking.planner_id === user.id
  const isProvider = providerUserId === user.id

  if (!isPlanner && !isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (quote.status !== 'pending') {
    return NextResponse.json({ error: 'Offerten kan inte längre ändras.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Provider: withdraw pending quote
  if (status === 'withdrawn') {
    if (!isProvider) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updated, error } = await admin
      .from('quotes')
      .update({ status: 'withdrawn' })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: 'Kunde inte ta tillbaka offerten.' }, { status: 500 })
    }

    await trackServer(
      'quote_withdrawn',
      { quote_id: params.id, booking_id: booking.id },
      user.id
    )

    return NextResponse.json({ ok: true, quote: updated })
  }

  // Provider: update pending quote fields
  const isProviderFieldUpdate =
    isProvider &&
    (price_sek != null ||
      description !== undefined ||
      duration !== undefined ||
      cancellation_policy !== undefined)

  if (isProviderFieldUpdate) {
    if (price_sek == null || Number(price_sek) < 1) {
      return NextResponse.json({ error: 'Ogiltigt pris.' }, { status: 400 })
    }

    const locked = validateQuoteLockedFields(
      { event_date: booking.event_date, event_location: booking.event_location },
      { event_date, location }
    )
    if (!locked.ok) {
      return NextResponse.json({ error: locked.error }, { status: 400 })
    }

    const policyId = isCancellationPolicyId(cancellation_policy) ? cancellation_policy : null

    if (!policyId) {
      return NextResponse.json(
        { error: 'Välj en giltig avbokningspolicy i offerten.' },
        { status: 400 }
      )
    }

    const policy = getCancellationPolicy(policyId)
    const price_ore = Math.round(Number(price_sek) * 100)

    const { data: updated, error } = await admin
      .from('quotes')
      .update({
        price_ore,
        description: description ?? null,
        duration: duration ?? null,
        event_date: locked.event_date,
        location: locked.location,
        cancellation_policy: policy?.detail ?? policyId,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: 'Kunde inte uppdatera offerten.' }, { status: 500 })
    }

    await trackServer(
      'quote_updated',
      { quote_id: params.id, booking_id: booking.id, price_ore },
      user.id
    )

    return NextResponse.json({ ok: true, quote: updated })
  }

  // Planner: accept or decline
  if (!isPlanner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (status !== 'accepted') {
    await admin.from('quotes').update({ status }).eq('id', params.id)
    await trackServer('quote_declined', { quote_id: params.id, booking_id: booking.id }, user.id)
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
        serviceTitle: service?.title ?? 'Bokning via Gigtorget',
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
    return NextResponse.json({
      ok: true,
      checkoutUrl: null,
      warning:
        'Offerten accepterades men betalningen kunde inte startas. Betala under Mina bokningar.',
    })
  }
}
