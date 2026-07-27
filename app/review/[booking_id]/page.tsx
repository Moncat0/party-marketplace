import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import ReviewForm from './ReviewForm'

export default async function ReviewPage({ params }: { params: { booking_id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, users!planner_id(id, name), services!service_id(title, provider_profiles(user_id, users(name)))')
    .eq('id', params.booking_id)
    .single()

  if (!booking) notFound()

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    title: string | null
    provider_profiles: { user_id: string; users: { name: string | null } | null } | { user_id: string; users: { name: string | null } | null }[] | null
  } | null
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
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
    ? (profile?.users?.name ?? service?.title ?? 'Talangen')
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
