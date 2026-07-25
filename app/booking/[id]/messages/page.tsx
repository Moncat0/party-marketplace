import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import MessageThread from './MessageThread'

export default async function MessagesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, event_date, event_location, users!planner_id(id, name), provider_profiles!provider_profile_id(user_id, service_title, users(name))')
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const profile = booking.provider_profiles as { user_id: string; service_title: string | null; users: { name: string | null } | null } | null
  const planner = booking.users as { id: string; name: string | null } | null

  const isPlanner = user.id === planner?.id
  const isProvider = user.id === profile?.user_id
  if (!isPlanner && !isProvider) notFound()

  // Allow accepted AND completed bookings to view their conversation
  if (!['accepted', 'completed'].includes(booking.status)) {
    redirect(isPlanner ? '/planner/dashboard' : '/dashboard')
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*, users!sender_id(name), quotes(*)')
    .eq('booking_request_id', params.id)
    .order('created_at', { ascending: true })

  // Mark unread messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('booking_request_id', params.id)
    .is('read_at', null)
    .neq('sender_id', user.id)

  const otherName = isPlanner
    ? (profile?.users?.name ?? profile?.service_title ?? 'Talangen')
    : (planner?.name ?? 'Arrangören')

  return (
    <MessageThread
      bookingId={params.id}
      currentUserId={user.id}
      messages={messages ?? []}
      otherName={otherName}
      isPlanner={isPlanner}
      isProvider={isProvider}
      isCompleted={booking.status === 'completed'}
      eventDate={booking.event_date ?? null}
      eventLocation={booking.event_location ?? null}
    />
  )
}
