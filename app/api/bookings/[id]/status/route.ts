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
    .select(
      '*, users!planner_id(name, email, notif_booking_accepted, notif_booking_declined), services!service_id(title, provider_profiles(user_id, users(name)))'
    )
    .single()

  if (error || !booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const planner = booking.users as {
      name: string | null
      email: string
      notif_booking_accepted: boolean | null
      notif_booking_declined: boolean | null
    } | null
    const serviceRaw = booking.services as unknown
    const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
      title: string | null
      provider_profiles: { users: { name: string | null } | null } | { users: { name: string | null } | null }[] | null
    } | null
    const provider = service?.provider_profiles
      ? Array.isArray(service.provider_profiles)
        ? service.provider_profiles[0]
        : service.provider_profiles
      : null
    const providerName = provider?.users?.name ?? service?.title ?? 'Talangen'

    if (planner?.email) {
      if (status === 'accepted' && planner.notif_booking_accepted !== false) {
        await sendBookingAccepted(planner.email, planner.name ?? 'Hej', providerName, params.id)
      } else if (status === 'declined' && planner.notif_booking_declined !== false) {
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
