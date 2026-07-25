import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  if (!['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Fetch quote + booking to verify planner
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, booking_requests!booking_request_id(id, planner_id)')
    .eq('id', params.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const booking = (Array.isArray(quote.booking_requests)
    ? quote.booking_requests[0]
    : quote.booking_requests) as { id: string; planner_id: string } | null

  if (booking?.planner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (quote.status !== 'pending') return NextResponse.json({ error: 'Quote already responded to' }, { status: 400 })

  // Update quote status
  await supabase.from('quotes').update({ status }).eq('id', params.id)

  // If accepted: set price on booking and mark unpaid
  if (status === 'accepted' && booking) {
    await supabase.from('booking_requests').update({
      price_ore: quote.price_ore,
      payment_status: 'unpaid',
    }).eq('id', booking.id)
  }

  return NextResponse.json({ ok: true })
}
