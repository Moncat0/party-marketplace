import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pending', 'accepted', 'declined', 'completed', 'cancelled']

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await request.json().catch(() => ({}))
  const { status } = body

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Ogiltig status.' }, { status: 400 })
  }

  const { admin } = gate
  const { data: existing } = await admin
    .from('booking_requests')
    .select('id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Bokning hittades inte.' }, { status: 404 })

  const { error } = await admin
    .from('booking_requests')
    .update({ status })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, status })
}
