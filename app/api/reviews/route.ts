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
    .select('*, provider_profiles!provider_profile_id(user_id)')
    .eq('id', booking_request_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = booking.provider_profiles as { user_id: string } | null
  const isPlanner = user.id === booking.planner_id
  const isProvider = user.id === profile?.user_id
  if (!isPlanner && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      booking_request_id,
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
