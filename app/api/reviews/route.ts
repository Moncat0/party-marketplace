import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { trackServer } from '@/lib/track-server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_request_id, reviewee_id, rating, comment } = await request.json()

  if (!booking_request_id || !reviewee_id || !rating) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  // Verify user is part of this booking
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, services!service_id(provider_profiles(user_id))')
    .eq('id', booking_request_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    provider_profiles: { user_id: string } | { user_id: string }[] | null
  } | null
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
  const isPlanner = user.id === booking.planner_id
  const isProvider = user.id === profile?.user_id
  if (!isPlanner && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      booking_request_id,
      service_id: booking.service_id,
      reviewer_id: user.id,
      reviewee_id,
      rating,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  await trackServer('review_submitted', {
    booking_id: booking_request_id,
    rating,
    reviewer_type: isPlanner ? 'planner' : 'provider',
  }, user.id)

  return NextResponse.json({ review })
}
