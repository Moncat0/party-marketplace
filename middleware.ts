import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session so it doesn't expire while the user is active
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Soft-deactivated accounts cannot use the app
  if (user && !request.nextUrl.pathname.startsWith('/api/')) {
    const { data: row } = await supabase
      .from('users')
      .select('deactivated_at')
      .eq('id', user.id)
      .maybeSingle()

    if (row?.deactivated_at) {
      await supabase.auth.signOut()
      const url = new URL('/', request.url)
      url.searchParams.set('deactivated', '1')
      return NextResponse.redirect(url)
    }
  }

  // Protect /admin — only Monica can access it
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'monicaandreatorres@gmail.com'
    if (!user || user.email !== adminEmail) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Dev-only UI previews — never ship to production
  if (
    process.env.NODE_ENV === 'production' &&
    request.nextUrl.pathname.startsWith('/dev')
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
