import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const VALID_REASONS = [
  'Felaktig information',
  'Olämpligt innehåll',
  'Bedrägeri eller spam',
  'Upphovsrättsintrång',
  'Annat',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { target_type, target_id, reason, details } = body as {
    target_type?: string
    target_id?: string
    reason?: string
    details?: string
  }

  if (!target_type || !target_id || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validTargetTypes = ['service', 'user', 'review', 'message']
  if (!validTargetTypes.includes(target_type)) {
    return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 })
  }

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type,
    target_id,
    reason,
    details: details?.trim() || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
