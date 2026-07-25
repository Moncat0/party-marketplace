import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendBookingAccepted, sendBookingDeclined } from '@/lib/resend'
import { trackServer } from '@/lib/track-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status } = body

  if (!['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = { status }

  const { data: booking, error } = await supabase
    .from('booking_requests')
    .update(updatePayload)
    .eq('id', params.id)
    .select('*, users!planner_id(name, email), provider_profiles!provider_profile_id(user_id, service_title, users(name))')
    .single()

  if (error || !booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const planner = booking.users as { name: string | null; email: string } | null
    const profile = booking.provider_profiles as { service_title: string | null; users: { name: string | null } | null } | null
    const providerName = profile?.users?.name ?? profile?.service_title ?? 'Talangen'

    if (planner?.email) {
      if (status === 'accepted') {
        await sendBookingAccepted(planner.email, planner.name ?? 'Hej', providerName, params.id)
      } else {
        await sendBookingDeclined(planner.email, planner.name ?? 'Hej', providerName)
      }
    }
  } catch (emailError) {
    console.error('Email send failed:', emailError)
  }

  const eventName = status === 'accepted' ? 'booking_accepted' : 'booking_declined'
  await trackServer(eventName, { booking_id: params.id }, user.id)

  return NextResponse.json({ ok: true })
}
