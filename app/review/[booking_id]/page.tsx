import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import ReviewForm from './ReviewForm'

export default async function ReviewPage({ params }: { params: { booking_id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, users!planner_id(id, name), provider_profiles!provider_profile_id(user_id, service_title, users(name))')
    .eq('id', params.booking_id)
    .single()

  if (!booking) notFound()

  const profile = booking.provider_profiles as { user_id: string; service_title: string | null; users: { name: string | null } | null } | null
  const planner = booking.users as { id: string; name: string | null } | null

  const isPlanner = user.id === planner?.id
  const isProvider = user.id === profile?.user_id
  if (!isPlanner && !isProvider) notFound()

  if (booking.status !== 'completed' && booking.status !== 'accepted') redirect('/dashboard')

  // Check if user already submitted a review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_request_id', params.booking_id)
    .eq('reviewer_id', user.id)
    .single()

  const revieweeId = isPlanner ? profile!.user_id : planner!.id
  const revieweeName = isPlanner
    ? (profile?.users?.name ?? profile?.service_title ?? 'Talangen')
    : (planner?.name ?? 'Arrangören')

  return (
    <ReviewForm
      bookingId={params.booking_id}
      revieweeId={revieweeId}
      revieweeName={revieweeName}
      alreadyReviewed={!!existing}
    />
  )
}
