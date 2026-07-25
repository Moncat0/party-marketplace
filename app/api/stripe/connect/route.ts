import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// GET /api/stripe/connect — start Connect onboarding for the current provider
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/signup', request.url))

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.redirect(new URL('/onboarding', request.url))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3004'

  // Create or reuse the Express account
  let accountId = profile.stripe_account_id
  if (!accountId) {
    const { data: userData } = await supabase.from('users').select('email').eq('id', user.id).single()
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'SE',
      email: userData?.email ?? undefined,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    })
    accountId = account.id
    await supabase.from('provider_profiles').update({ stripe_account_id: accountId }).eq('id', profile.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/api/stripe/connect`,
    return_url: `${siteUrl}/api/stripe/connect/return`,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
