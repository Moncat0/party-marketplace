import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import GuestAppChrome from '@/components/GuestAppChrome'
import MessagesPanel from '@/components/messages/MessagesPanel'
import ConversationDetails from '@/components/messages/ConversationDetails'
import { type InboxThread } from '@/components/MessagesInbox'
import MessageThread from '@/app/booking/[id]/messages/MessageThread'
import { fetchMessagesWithReadReceiptPrivacy } from '@/lib/messages-privacy'
import { bookingOccasionLabel } from '@/lib/booking-labels'
import { markThreadRead } from '@/lib/message-access'
import { resolveBookingCancellationPolicyId } from '@/lib/booking-cancel'
import {
  formatInboxLastText,
  loadInboxMessageMeta,
} from '@/lib/message-inbox'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Meddelanden' }

export default async function PlannerMessagesPage({
  searchParams,
}: {
  searchParams: { c?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const activeId = searchParams.c ?? null

  const [{ data: bookings }] = await Promise.all([
    supabase
      .from('booking_requests')
      .select(
        `id, event_date, event_type, occasions, status, event_location, guest_count, description,
         price_ore, payment_status, created_at,
         services!service_id(
           id, title, photos, cancellation_policy,
           provider_profiles(user_id, stripe_onboarded, users(name))
         )`
      )
      .eq('planner_id', user.id)
      .in('status', ['accepted', 'completed'])
      .order('created_at', { ascending: false }),
    activeId ? markThreadRead(supabase, activeId, user.id) : Promise.resolve(),
  ])

  const bookingIds = (bookings ?? []).map(b => b.id)
  const metaByBooking = await loadInboxMessageMeta(supabase, bookingIds, user.id)

  const threadsRaw = (bookings ?? []).map(booking => {
    const meta = metaByBooking.get(booking.id)
    const service = (
      Array.isArray(booking.services) ? booking.services[0] : booking.services
    ) as unknown as {
      id: string
      title: string | null
      photos: string[] | null
      cancellation_policy?: string | null
      provider_profiles:
        | {
            user_id: string
            stripe_onboarded?: boolean | null
            users: { name: string | null } | { name: string | null }[] | null
          }
        | {
            user_id: string
            stripe_onboarded?: boolean | null
            users: { name: string | null } | { name: string | null }[] | null
          }[]
        | null
    } | null

    const profile = service?.provider_profiles
      ? Array.isArray(service.provider_profiles)
        ? service.provider_profiles[0]
        : service.provider_profiles
      : null

    const userRow = profile?.users
      ? Array.isArray(profile.users)
        ? profile.users[0]
        : profile.users
      : null
    const name = userRow?.name ?? service?.title ?? 'Talang'

    const thread: InboxThread = {
      id: booking.id,
      name,
      subtitle:
        service?.title && userRow?.name
          ? service.title
          : bookingOccasionLabel(booking),
      lastText: formatInboxLastText(meta?.lastMsg ?? null, user.id),
      lastAt: meta?.lastMsg?.created_at ?? null,
      unread: meta?.unread ?? 0,
    }
    return { thread, booking, profile, service }
  })

  const threads = threadsRaw.map(t => t.thread)
  const active = activeId ? threadsRaw.find(t => t.thread.id === activeId) : null

  let embeddedThread: ReactNode = null
  let details: ReactNode = null

  if (active) {
    const otherUserId = active.profile?.user_id
    const [{ data: quoteRows }, messages] = await Promise.all([
      supabase
        .from('quotes')
        .select('status, cancellation_policy')
        .eq('booking_request_id', active.booking.id),
      otherUserId
        ? fetchMessagesWithReadReceiptPrivacy(
            supabase,
            active.booking.id,
            user.id,
            otherUserId
          )
        : Promise.resolve([]),
    ])

    const acceptedQuote = (quoteRows ?? []).find(q => q.status === 'accepted')
    const cancellationPolicyId = resolveBookingCancellationPolicyId({
      acceptedQuotePolicy: acceptedQuote?.cancellation_policy,
      servicePolicy: active.service?.cancellation_policy ?? null,
    })

    embeddedThread = (
      <MessageThread
        bookingId={active.booking.id}
        currentUserId={user.id}
        messages={messages}
        otherName={active.thread.name}
        isPlanner
        isProvider={false}
        isCompleted={active.booking.status === 'completed'}
        eventDate={active.booking.event_date ?? null}
        eventLocation={active.booking.event_location ?? null}
        guestCount={active.booking.guest_count ?? null}
        eventType={active.booking.event_type ?? null}
        inquiryAt={active.booking.created_at ?? null}
        serviceId={active.service?.id ?? null}
        serviceTitle={active.service?.title ?? null}
        embedded
      />
    )

    details = (
      <ConversationDetails
        inboxPath="/planner/messages"
        booking={{
          id: active.booking.id,
          status: active.booking.status,
          event_date: active.booking.event_date,
          event_type: active.booking.event_type,
          occasions: active.booking.occasions,
          event_location: active.booking.event_location,
          guest_count: active.booking.guest_count,
          description: active.booking.description,
          price_ore: active.booking.price_ore,
          payment_status: active.booking.payment_status,
          cancellationPolicyId,
        }}
        side={{
          role: 'planner',
          providerName: active.thread.name,
          serviceTitle: active.service?.title ?? null,
          servicePhoto: active.service?.photos?.[0] ?? null,
          serviceId: active.service?.id ?? null,
          stripeOnboarded: !!active.profile?.stripe_onboarded,
        }}
      />
    )
  }

  return (
    <GuestAppChrome flush>
      <MessagesPanel
        userId={user.id}
        threads={threads}
        activeId={activeId}
        inboxPath="/planner/messages"
        threadPath="/booking/:id/messages"
        conversation={embeddedThread}
        details={details}
        fillParent
      />
    </GuestAppChrome>
  )
}
