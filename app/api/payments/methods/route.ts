import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

async function getOrCreateCustomer(email: string, name: string | null, userId: string) {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data[0]) {
    return existing.data[0].id
  }
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { festen_user_id: userId },
  })
  return customer.id
}

/** Create a SetupIntent so the client can save a card. */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  try {
    const customerId = await getOrCreateCustomer(user.email, profile?.name ?? null, user.id)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { festen_user_id: user.id },
    })
    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })
  } catch (e) {
    console.error('setup-intent failed', e)
    return NextResponse.json({ error: 'Kunde inte starta kortregistrering' }, { status: 500 })
  }
}

/** List saved cards for the current user. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const existing = await stripe.customers.list({ email: user.email, limit: 1 })
    const customerId = existing.data[0]?.id
    if (!customerId) return NextResponse.json({ methods: [] })

    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return NextResponse.json({
      methods: methods.data.map(m => ({
        id: m.id,
        brand: m.card?.brand ?? 'card',
        last4: m.card?.last4 ?? '••••',
        expMonth: m.card?.exp_month ?? null,
        expYear: m.card?.exp_year ?? null,
      })),
    })
  } catch (e) {
    console.error('list payment methods failed', e)
    return NextResponse.json({ error: 'Kunde inte hämta betalningsmetoder' }, { status: 500 })
  }
}
