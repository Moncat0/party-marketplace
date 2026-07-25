import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendProviderInvite } from '@/lib/resend'
import { trackServer } from '@/lib/track-server'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Max 5 invites per hour per user
  const limit = await rateLimit(user.id, 'invite', 5, 3600)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Du har skickat för många inbjudningar. Försök igen om en timme.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const { email, message } = await request.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const { data: sender } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const inviterName = sender?.name ?? 'Någon'

  try {
    await sendProviderInvite(email, inviterName, message ?? null)
    await trackServer('provider_nominated', { nominated_email: email }, user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Invite send failed:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
