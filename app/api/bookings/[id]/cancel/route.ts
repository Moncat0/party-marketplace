import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import {
  cancelRefundPaymentStatus,
  expectedRefundOre,
  resolveBookingCancellationPolicyId,
  type CancelRole,
} from '@/lib/booking-cancel'
import { isFundsHeld } from '@/lib/payments'
import { sendBookingCancelled } from '@/lib/resend'
import { trackServer } from '@/lib/track-server'

function unwrap<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const cancelReason =
    typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : null

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('booking_requests')
    .select(
      `
      id, planner_id, status, event_date, price_ore, payment_status,
      stripe_payment_intent_id,
      users!planner_id(name, email, notif_booking_accepted),
      services!service_id(
        title,
        cancellation_policy,
        provider_profiles(user_id, users(name, email, notif_booking_accepted))
      ),
      quotes(id, status, cancellation_policy)
    `
    )
    .eq('id', params.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Bokningen hittades inte.' }, { status: 404 })
  }

  if (booking.status !== 'accepted') {
    return NextResponse.json(
      { error: 'Endast accepterade bokningar kan avbokas.' },
      { status: 400 }
    )
  }

  const service = unwrap(booking.services) as {
    title: string | null
    cancellation_policy: string | null
    provider_profiles:
      | {
          user_id: string
          users: { name: string | null; email: string; notif_booking_accepted: boolean | null } | null
        }
      | null
  } | null

  const providerProfile = unwrap(service?.provider_profiles)
  const providerUserId = providerProfile?.user_id ?? null
  const isPlanner = booking.planner_id === user.id
  const isProvider = providerUserId === user.id

  if (!isPlanner && !isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cancelledBy: CancelRole = isPlanner ? 'planner' : 'provider'
  const acceptedQuote = (booking.quotes as { id: string; status: string; cancellation_policy: string | null }[] | null)?.find(
    q => q.status === 'accepted'
  )
  const policyId = resolveBookingCancellationPolicyId({
    acceptedQuotePolicy: acceptedQuote?.cancellation_policy,
    servicePolicy: service?.cancellation_policy,
  })

  const refundOre = expectedRefundOre({
    role: cancelledBy,
    priceOre: booking.price_ore,
    paymentStatus: booking.payment_status,
    eventDate: booking.event_date,
    policyId,
  })

  let stripeRefundId: string | null = null

  if (
    refundOre > 0 &&
    isFundsHeld(booking.payment_status) &&
    booking.stripe_payment_intent_id
  ) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundOre,
      })
      stripeRefundId = refund.id
    } catch (err) {
      console.error('Stripe refund failed', err)
      return NextResponse.json(
        { error: 'Kunde inte genomföra återbetalningen. Försök igen eller kontakta support.' },
        { status: 502 }
      )
    }
  }

  const now = new Date().toISOString()
  const nextPaymentStatus = cancelRefundPaymentStatus(refundOre, booking.price_ore)

  const updatePayload: Record<string, unknown> = {
    status: 'cancelled',
    cancelled_at: now,
    cancelled_by: cancelledBy,
    cancel_reason: cancelReason,
    refund_ore: refundOre > 0 ? refundOre : null,
    stripe_refund_id: stripeRefundId,
  }

  if (nextPaymentStatus) {
    updatePayload.payment_status = nextPaymentStatus
    updatePayload.refunded_at = now
  }

  const { error: updateError } = await admin
    .from('booking_requests')
    .update(updatePayload)
    .eq('id', params.id)
    .eq('status', 'accepted')

  if (updateError) {
    console.error('Cancel booking update failed', updateError)
    return NextResponse.json({ error: 'Kunde inte avboka.' }, { status: 500 })
  }

  const planner = unwrap(booking.users) as {
    name: string | null
    email: string
    notif_booking_accepted: boolean | null
  } | null
  const providerUser = providerProfile?.users ?? null
  const serviceTitle = service?.title ?? 'Bokning'
  const plannerName = planner?.name ?? 'Arrangören'
  const providerName = providerUser?.name ?? 'Talangen'
  const cancellerName = cancelledBy === 'planner' ? plannerName : providerName

  try {
    if (providerUser?.email && providerUser.notif_booking_accepted !== false) {
      await sendBookingCancelled({
        to: providerUser.email,
        recipientName: providerName,
        otherName: cancellerName,
        serviceTitle,
        bookingId: params.id,
        cancelledBy,
        refundOre,
      })
    }
    if (planner?.email && planner.notif_booking_accepted !== false) {
      await sendBookingCancelled({
        to: planner.email,
        recipientName: plannerName,
        otherName: cancellerName,
        serviceTitle,
        bookingId: params.id,
        cancelledBy,
        refundOre,
      })
    }
  } catch (emailError) {
    console.error('Cancel email failed', emailError)
  }

  await trackServer(
    'booking_cancelled',
    {
      booking_id: params.id,
      cancelled_by: cancelledBy,
      refund_ore: refundOre,
      had_refund: refundOre > 0,
    },
    user.id
  )

  return NextResponse.json({
    ok: true,
    refund_ore: refundOre,
    cancelled_by: cancelledBy,
  })
}
