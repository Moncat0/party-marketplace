import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import MessageThread from './MessageThread'
import GuestAppChrome from '@/components/GuestAppChrome'
import { fetchMessagesWithReadReceiptPrivacy } from '@/lib/messages-privacy'

export default async function MessagesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: booking } = await supabase
    .from('booking_requests')
    .select(
      '*, event_date, event_location, guest_count, event_type, created_at, users!planner_id(id, name), services!service_id(id, title, provider_profiles(user_id, users(name)))'
    )
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    id: string
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

  if (!['accepted', 'completed'].includes(booking.status)) {
    redirect(isPlanner ? '/planner/dashboard' : '/dashboard')
  }

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('booking_request_id', params.id)
    .is('read_at', null)
    .neq('sender_id', user.id)

  const otherUserId = isPlanner ? profile!.user_id : planner!.id
  const messages = await fetchMessagesWithReadReceiptPrivacy(
    supabase,
    params.id,
    user.id,
    otherUserId
  )

  const otherName = isPlanner
    ? profile?.users?.name ?? service?.title ?? 'Talangen'
    : planner?.name ?? 'Arrangören'

  const thread = (
    <MessageThread
      bookingId={params.id}
      currentUserId={user.id}
      messages={messages}
      otherName={otherName}
      isPlanner={isPlanner}
      isProvider={isProvider}
      isCompleted={booking.status === 'completed'}
      eventDate={booking.event_date ?? null}
      eventLocation={booking.event_location ?? null}
      guestCount={booking.guest_count ?? null}
      eventType={booking.event_type ?? null}
      inquiryAt={booking.created_at ?? null}
      serviceId={service?.id ?? null}
      serviceTitle={service?.title ?? null}
      embedded={isPlanner}
      showBackLink={isPlanner}
    />
  )

  if (isPlanner) {
    return (
      <GuestAppChrome flush>
        <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-5.5rem)]">{thread}</div>
      </GuestAppChrome>
    )
  }

  return thread
}
