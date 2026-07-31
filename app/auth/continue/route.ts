import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import {
  INTENT_COOKIE,
  parseAuthIntent,
  resolvePostAuthDestination,
  type AuthIntent,
} from '@/lib/auth-intent'
import { needsTermsAndAge } from '@/lib/auth-compliance'
import { ensureAppUser, intentFromUserMetadata } from '@/lib/ensure-user'
import { needsDisplayName } from '@/lib/profile-completeness'

function safeNext(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

/**
 * Post-login redirect for password sign-in (session already established client-side).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const nextParam = safeNext(searchParams.get('next'))
  const intentFromQuery = parseAuthIntent(searchParams.get('intent'))

  const cookieStore = await cookies()
  const intentFromCookie = parseAuthIntent(cookieStore.get(INTENT_COOKIE)?.value)
  let intent: AuthIntent | null = intentFromQuery ?? intentFromCookie

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/?auth=1`)
  }

  if (!intent) {
    intent = intentFromUserMetadata(user)
  }

  const signupSource = cookieStore.get('signup_source')?.value ?? 'organic'
  const referrerId = cookieStore.get('referrer_id')?.value ?? null

  await ensureAppUser(supabase, user, {
    intent,
    signupSource,
    referrerId,
  })

  const [{ data: profile }, { data: appUser }] = await Promise.all([
    supabase
      .from('provider_profiles')
      .select('id, services(is_published)')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('users')
      .select('name, first_name, terms_accepted_at, age_confirmed_at')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const service = profile
    ? Array.isArray(profile.services)
      ? profile.services[0]
      : profile.services
    : null

  const destination = resolvePostAuthDestination({
    intent,
    next: nextParam,
    hasProviderProfile: !!profile,
    isPublished: !!service?.is_published,
    needsDisplayName: needsDisplayName(appUser),
    needsTermsAndAge: needsTermsAndAge(appUser),
  })

  const response = NextResponse.redirect(`${origin}${destination}`)
  response.cookies.set(INTENT_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
