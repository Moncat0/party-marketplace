import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewMessage } from '@/lib/resend'
import { trackServer } from '@/lib/track-server'
import { rateLimit } from '@/lib/rateLimit'
import { fetchMessagesWithReadReceiptPrivacy } from '@/lib/messages-privacy'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookingId = request.nextUrl.searchParams.get('booking_request_id')
  if (!bookingId) return NextResponse.json({ error: 'Missing booking_request_id' }, { status: 400 })

  // Verify user is part of this booking
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, services!service_id(provider_profiles(user_id))')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    provider_profiles: { user_id: string } | { user_id: string }[] | null
  } | null
  const provider = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
  const isPlanner = user.id === booking.planner_id
  const isProvider = user.id === provider?.user_id
  if (!isPlanner && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const otherUserId = isPlanner ? provider!.user_id : booking.planner_id
  const messages = await fetchMessagesWithReadReceiptPrivacy(
    supabase,
    bookingId,
    user.id,
    otherUserId
  )

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_request_id, content, image_url } = await request.json()
  if (!booking_request_id || (!content?.trim() && !image_url)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Max 30 messages per hour per user
  const limit = await rateLimit(user.id, 'message', 30, 3600)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Du skickar meddelanden för snabbt. Försök igen om en timme.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  // Verify user is part of this booking and get other party's info for email
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, users!planner_id(id, name, email), services!service_id(provider_profiles(user_id, users(name, email)))')
    .eq('id', booking_request_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const serviceRaw = booking.services as unknown
  const bookingService = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    provider_profiles:
      | { user_id: string; users: { name: string | null; email: string } | null }
      | { user_id: string; users: { name: string | null; email: string } | null }[]
      | null
  } | null
  const profile = bookingService?.provider_profiles
    ? Array.isArray(bookingService.provider_profiles)
      ? bookingService.provider_profiles[0]
      : bookingService.provider_profiles
    : null
  const planner = booking.users as { id: string; name: string | null; email: string } | null

  const isPlanner = user.id === planner?.id
  const isProvider = user.id === profile?.user_id
  if (!isPlanner && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      booking_request_id,
      sender_id: user.id,
      content: content?.trim() || null,
      image_url: image_url || null,
    })
    .select('*, users!sender_id(name)')
    .single()

  if (error || !message) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

  // Email the other party (respect notif_new_message)
  try {
    const { data: sender } = await supabase.from('users').select('name').eq('id', user.id).single()
    const senderName = sender?.name ?? 'Någon'

    if (isPlanner && profile?.users?.email) {
      const { data: recipient } = await supabase
        .from('users')
        .select('notif_new_message')
        .eq('id', profile.user_id)
        .single()
      if (recipient?.notif_new_message !== false) {
        await sendNewMessage(profile.users.email, senderName, booking_request_id)
      }
    } else if (isProvider && planner?.email) {
      const { data: recipient } = await supabase
        .from('users')
        .select('notif_new_message')
        .eq('id', planner.id)
        .single()
      if (recipient?.notif_new_message !== false) {
        await sendNewMessage(planner.email, senderName, booking_request_id)
      }
    }
  } catch (emailError) {
    console.error('Email send failed:', emailError)
  }

  await trackServer('message_sent', {
    booking_id: booking_request_id,
    sender_type: isPlanner ? 'planner' : 'provider',
  }, user.id)

  return NextResponse.json({ message })
}
