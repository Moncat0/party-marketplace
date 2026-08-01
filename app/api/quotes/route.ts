import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { isMessagingAllowedStatus } from '@/lib/message-access'
import { getCancellationPolicy, isCancellationPolicyId } from '@/lib/cancellation-policies'
import { trackServer } from '@/lib/track-server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    booking_request_id,
    price_sek,
    description,
    duration,
    event_date,
    location,
    cancellation_policy,
  } = await request.json()

  if (!booking_request_id || !price_sek || price_sek < 1) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: booking } = await supabase
    .from('booking_requests')
    .select(
      `
      *,
      services!service_id(
        id,
        cancellation_policy,
        provider_profiles(user_id, stripe_account_id, stripe_onboarded)
      )
    `
    )
    .eq('id', booking_request_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!isMessagingAllowedStatus(booking.status)) {
    return NextResponse.json(
      { error: 'Offert kan endast skickas för accepterade bokningar.' },
      { status: 409 }
    )
  }

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    id: string
    cancellation_policy: string | null
    provider_profiles:
      | { user_id: string; stripe_account_id: string | null; stripe_onboarded: boolean }
      | { user_id: string; stripe_account_id: string | null; stripe_onboarded: boolean }[]
      | null
  } | null

  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null

  if (profile?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft gate: must finish Stripe Express before sending a priced quote
  if (!profile.stripe_account_id || !profile.stripe_onboarded) {
    return NextResponse.json(
      {
        error:
          'Koppla utbetalningar via Stripe innan du skickar en offert. Du hittar det under Konto → Betalningar.',
        code: 'stripe_required',
      },
      { status: 403 }
    )
  }

  const policyId = isCancellationPolicyId(cancellation_policy)
    ? cancellation_policy
    : isCancellationPolicyId(service?.cancellation_policy)
      ? service!.cancellation_policy
      : null

  if (!policyId) {
    return NextResponse.json(
      {
        error:
          'Välj en avbokningspolicy på tjänsten (Flexibel, Måttlig eller Strikt) innan du skickar offert.',
        code: 'cancellation_policy_required',
      },
      { status: 400 }
    )
  }

  const policy = getCancellationPolicy(policyId)
  const price_ore = Math.round(Number(price_sek) * 100)

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      booking_request_id,
      service_id: service!.id,
      price_ore,
      description: description || null,
      duration: duration || null,
      event_date: event_date || null,
      location: location || null,
      cancellation_policy: policy?.detail ?? policyId,
      status: 'pending',
    })
    .select()
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }

  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      booking_request_id,
      sender_id: user.id,
      // Empty string keeps older DBs with NOT NULL content happy; null is fine after migration.
      content: '',
      quote_id: quote.id,
    })
    .select('*, users!sender_id(name), quotes(*)')
    .single()

  if (msgError || !message) {
    console.error('quote message insert failed', msgError)
    return NextResponse.json(
      { error: 'Failed to create message', detail: msgError?.message },
      { status: 500 }
    )
  }

  await trackServer(
    'quote_sent',
    {
      booking_id: booking_request_id,
      quote_id: quote.id,
      price_ore,
      cancellation_policy: policyId,
    },
    user.id
  )

  return NextResponse.json({ message })
}
