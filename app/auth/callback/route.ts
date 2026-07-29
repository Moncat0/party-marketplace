import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import {
  INTENT_COOKIE,
  parseAuthIntent,
  resolvePostAuthDestination,
  type AuthIntent,
} from '@/lib/auth-intent'
import { ensureAppUser, intentFromUserMetadata } from '@/lib/ensure-user'
import { needsDisplayName } from '@/lib/profile-completeness'

function safeNext(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const nextParam = safeNext(searchParams.get('next'))
  const intentFromQuery = parseAuthIntent(searchParams.get('intent'))

  if (code || (tokenHash && type)) {
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

    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: type as 'email' | 'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change',
        })

    if (error) {
      console.error('[auth/callback] session exchange failed:', error.message, error)
      return NextResponse.redirect(`${origin}/signup?error=auth`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!intent && user) {
      intent = intentFromUserMetadata(user)
    }

    let hasProviderProfile = false
    let isPublished = false
    let missingDisplayName = false
    let needsProviderBio = false

    if (user) {
      const signupSource = cookieStore.get('signup_source')?.value ?? 'organic'
      const referrerId = cookieStore.get('referrer_id')?.value ?? null

      const { error: ensureError } = await ensureAppUser(supabase, user, {
        intent,
        signupSource,
        referrerId,
      })
      if (ensureError) {
        console.error('[auth/callback] ensureAppUser failed:', ensureError)
      }

      const [{ data: profile }, { data: appUser }] = await Promise.all([
        supabase
          .from('provider_profiles')
          .select('id, bio, services(is_published)')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('users')
          .select('name, first_name, user_type')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      const service = profile
        ? Array.isArray(profile.services)
          ? profile.services[0]
          : profile.services
        : null

      hasProviderProfile = !!profile
      isPublished = !!service?.is_published
      missingDisplayName = needsDisplayName(appUser)

      const providerSide =
        intent === 'provider' ||
        appUser?.user_type === 'provider' ||
        appUser?.user_type === 'both'
      // Only nudge unpublished / onboarding providers — don’t interrupt published hosts every login
      if (providerSide && !isPublished && !(profile?.bio ?? '').trim()) {
        needsProviderBio = true
      }
    }

    const destination = resolvePostAuthDestination({
      intent,
      next: nextParam,
      hasProviderProfile,
      isPublished,
      needsDisplayName: missingDisplayName,
      needsProviderBio,
    })

    const response = NextResponse.redirect(`${origin}${destination}`)
    // Clear intent cookie after use
    response.cookies.set(INTENT_COOKIE, '', { path: '/', maxAge: 0 })
    return response
  }

  return NextResponse.redirect(`${origin}/signup?error=auth`)
}
