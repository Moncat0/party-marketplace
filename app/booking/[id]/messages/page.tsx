import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import MessageThread from './MessageThread'
import GuestAppChrome from '@/components/GuestAppChrome'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import ConversationDetails from '@/components/messages/ConversationDetails'
import { fetchMessagesWithReadReceiptPrivacy } from '@/lib/messages-privacy'
import { markThreadRead } from '@/lib/message-access'
import { resolveBookingCancellationPolicyId } from '@/lib/booking-cancel'
import type { QuoteRecord } from '@/lib/quotes'

export default async function MessagesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: booking } = await supabase
    .from('booking_requests')
    .select(
      '*, event_date, event_location, guest_count, event_type, occasions, created_at, description, price_ore, payment_status, users!planner_id(id, name, avatar_url), services!service_id(id, title, photos, provider_profiles(user_id, stripe_onboarded, users(name)))'
    )
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const serviceRaw = booking.services as unknown
  const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
    id: string
    title: string | null
    photos: string[] | null
    provider_profiles: {
      user_id: string
      stripe_onboarded?: boolean | null
      users: { name: string | null } | null
    } | {
      user_id: string
      stripe_onboarded?: boolean | null
      users: { name: string | null } | null
    }[] | null
  } | null
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
  const planner = booking.users as {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null

  const isPlanner = user.id === planner?.id
  const isProvider = user.id === profile?.user_id
  if (!isPlanner && !isProvider) notFound()

  if (!['accepted', 'completed'].includes(booking.status)) {
    redirect(isPlanner ? '/planner/dashboard' : '/dashboard')
  }

  await markThreadRead(supabase, params.id, user.id)

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

  const { data: acceptedQuote } = await supabase
    .from('quotes')
    .select('cancellation_policy')
    .eq('booking_request_id', params.id)
    .eq('status', 'accepted')
    .maybeSingle()

  const { data: pendingQuoteRow } = await supabase
    .from('quotes')
    .select(
      'id, status, price_ore, description, duration, event_date, location, cancellation_policy'
    )
    .eq('booking_request_id', params.id)
    .eq('status', 'pending')
    .maybeSingle()

  const pendingQuote: QuoteRecord | null = pendingQuoteRow
    ? {
        id: pendingQuoteRow.id,
        status: pendingQuoteRow.status as QuoteRecord['status'],
        price_ore: pendingQuoteRow.price_ore,
        description: pendingQuoteRow.description,
        duration: pendingQuoteRow.duration,
        event_date: pendingQuoteRow.event_date,
        location: pendingQuoteRow.location,
        cancellation_policy: pendingQuoteRow.cancellation_policy,
      }
    : null

  const cancellationPolicyId = resolveBookingCancellationPolicyId({
    acceptedQuotePolicy: acceptedQuote?.cancellation_policy ?? null,
  })

  const bookingDetails = (
    <ConversationDetails
      bare
      inboxPath={isPlanner ? '/planner/messages' : '/dashboard/messages'}
      booking={{
        id: booking.id,
        status: booking.status,
        event_date: booking.event_date,
        event_type: booking.event_type,
        occasions: booking.occasions,
        event_location: booking.event_location,
        guest_count: booking.guest_count,
        description: booking.description,
        price_ore: booking.price_ore,
        payment_status: booking.payment_status,
        cancellationPolicyId,
      }}
      pendingQuote={pendingQuote}
      side={
        isPlanner
          ? {
              role: 'planner',
              providerName: otherName,
              serviceTitle: service?.title ?? null,
              servicePhoto: service?.photos?.[0] ?? null,
              serviceId: service?.id ?? null,
              stripeOnboarded: !!profile?.stripe_onboarded,
            }
          : {
              role: 'provider',
              plannerName: planner?.name ?? 'Arrangören',
              plannerAvatarUrl: planner?.avatar_url ?? null,
            }
      }
    />
  )

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
      embedded
      showBackLink
      bookingDetails={bookingDetails}
    />
  )

  if (isPlanner) {
    return (
      <GuestAppChrome flush>
        <div className="flex h-full min-h-0 flex-1 flex-col">{thread}</div>
      </GuestAppChrome>
    )
  }

  return (
    <ProviderHostShell flush>
      <div className="flex h-full min-h-0 flex-1 flex-col">{thread}</div>
    </ProviderHostShell>
  )
}
