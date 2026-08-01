import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/payments'
import { trackServer } from '@/lib/track-server'
import Stripe from 'stripe'

/**
 * GET /api/stripe/connect
 * - Not onboarded → Account Link (onboarding)
 * - Onboarded → Express Dashboard login link
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/signup', request.url))

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, stripe_account_id, stripe_onboarded')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.redirect(new URL('/onboarding', request.url))

  try {
    let accountId = profile.stripe_account_id

    if (!accountId) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single()
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'SE',
        email: userData?.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { festen_user_id: user.id },
      })
      accountId = account.id
      await supabase
        .from('provider_profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', profile.id)
    }

    // Already onboarded → Express login link (manage bank / tax / payouts)
    if (profile.stripe_onboarded) {
      const login = await stripe.accounts.createLoginLink(accountId)
      return NextResponse.redirect(login.url)
    }

    // Still onboarding / incomplete
    const account = await stripe.accounts.retrieve(accountId)
    const ready =
      account.details_submitted &&
      account.charges_enabled &&
      !account.requirements?.currently_due?.length

    if (ready) {
      await supabase
        .from('provider_profiles')
        .update({ stripe_onboarded: true })
        .eq('id', profile.id)
      await trackServer('stripe_connected', { account_id: accountId }, user.id)
      const login = await stripe.accounts.createLoginLink(accountId)
      return NextResponse.redirect(login.url)
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SITE_URL}/api/stripe/connect`,
      return_url: `${SITE_URL}/api/stripe/connect/return`,
      type: 'account_onboarding',
    })

    return NextResponse.redirect(accountLink.url)
  } catch (err) {
    console.error('stripe connect failed', err)

    const message =
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      /signed up for Connect/i.test(err.message)
        ? 'connect_not_enabled'
        : 'error'

    return NextResponse.redirect(
      `${SITE_URL}/dashboard/account?s=payments&stripe=${message}`
    )
  }
}
