import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// GET /api/stripe/connect/return — Stripe redirects here after onboarding
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/signup', request.url))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3004'

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    return NextResponse.redirect(new URL('/dashboard?stripe=error', request.url))
  }

  // Verify the account is fully onboarded
  const account = await stripe.accounts.retrieve(profile.stripe_account_id)
  const onboarded = account.details_submitted && !account.requirements?.currently_due?.length

  if (onboarded) {
    await supabase.from('provider_profiles')
      .update({ stripe_onboarded: true })
      .eq('id', profile.id)
    return NextResponse.redirect(new URL('/dashboard?stripe=connected', request.url))
  }

  // Not fully done yet — send back to onboarding
  return NextResponse.redirect(new URL('/dashboard?stripe=incomplete', request.url))
}
