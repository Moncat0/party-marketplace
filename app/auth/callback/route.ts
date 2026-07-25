import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('[auth/callback] cookies present:', allCookies.map(c => c.name))
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error)
    }

    if (!error) {
      // Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if this user already has a record in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        // If not, create one now
        if (!existingUser) {
          const signupSource = cookieStore.get('signup_source')?.value ?? 'organic'
          const referrerId = cookieStore.get('referrer_id')?.value ?? null

          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            user_type: 'planner',
            auth_provider: user.app_metadata?.provider ?? 'email',
            signup_source: signupSource,
            referrer_id: referrerId,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/signup?error=auth`)
}
