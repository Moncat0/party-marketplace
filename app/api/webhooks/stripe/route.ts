import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'

// Stripe requires the raw body for signature verification
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.booking_id

    if (bookingId) {
      const supabase = await createClient()
      await supabase.from('booking_requests').update({
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string | null,
        paid_at: new Date().toISOString(),
      }).eq('id', bookingId)

      console.log(`Payment confirmed for booking ${bookingId}`)
    }
  }

  return NextResponse.json({ received: true })
}
