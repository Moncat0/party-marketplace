import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isValidE164, isValidEmail } from '@/lib/auth-identifier'

/**
 * Check whether email or phone already has a Gigtorget account (public.users).
 * Steers Continue toward login vs signup after the identify step.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; phone?: string }
  try {
    body = (await request.json()) as { email?: string; phone?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const phone = (body.phone ?? '').trim()

  if (email) {
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
        console.error('[identifier-exists]', error.message)
        return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
      }

      return NextResponse.json({ exists: !!data, kind: 'email' as const })
    } catch (e) {
      console.error('[identifier-exists]', e)
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
    }
  }

  if (phone) {
    if (!isValidE164(phone)) {
      return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
    }
    try {
      const admin = createAdminClient()
      // Match E.164 or common local variants stored without +
      const variants = [phone, phone.replace(/^\+/, ''), phone.replace(/^\+46/, '0')]
      const { data, error } = await admin
        .from('users')
        .select('id')
        .in('phone', variants)
        .limit(1)

      if (error) {
        console.error('[identifier-exists]', error.message)
        return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
      }

      return NextResponse.json({
        exists: (data?.length ?? 0) > 0,
        kind: 'phone' as const,
      })
    } catch (e) {
      console.error('[identifier-exists]', e)
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'missing_identifier' }, { status: 400 })
}
