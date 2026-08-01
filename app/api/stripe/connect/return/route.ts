import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/payments'
import { trackServer } from '@/lib/track-server'

// GET /api/stripe/connect/return — Stripe redirects here after onboarding
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/signup', request.url))

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/account?s=payments&stripe=error`)
  }

  const account = await stripe.accounts.retrieve(profile.stripe_account_id)
  const onboarded =
    !!account.details_submitted &&
    !!account.charges_enabled &&
    !(account.requirements?.currently_due?.length)

  if (onboarded) {
    await supabase
      .from('provider_profiles')
      .update({ stripe_onboarded: true })
      .eq('id', profile.id)
    await trackServer(
      'stripe_connected',
      { account_id: profile.stripe_account_id },
      user.id
    )
    return NextResponse.redirect(`${SITE_URL}/dashboard/account?s=payments&stripe=connected`)
  }

  return NextResponse.redirect(`${SITE_URL}/dashboard/account?s=payments&stripe=incomplete`)
}
