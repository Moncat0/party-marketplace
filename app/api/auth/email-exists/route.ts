import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Check whether an email already has a Festly account (public.users).
 * Used before email signup to steer existing users to login.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = (await request.json()) as { email?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[email-exists]', error.message)
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
    }

    return NextResponse.json({ exists: !!data })
  } catch (e) {
    console.error('[email-exists]', e)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }
}
