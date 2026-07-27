import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import MessagesPanel from '@/components/messages/MessagesPanel'
import ConversationDetails from '@/components/messages/ConversationDetails'
import { type InboxThread } from '@/components/MessagesInbox'
import MessageThread from '@/app/booking/[id]/messages/MessageThread'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { fetchMessagesWithReadReceiptPrivacy } from '@/lib/messages-privacy'
import { getServiceForUser } from '@/lib/services'
import { formatEventType } from '@/lib/event-types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Meddelanden' }

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams: { c?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const result = await getServiceForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceId = result.service?.id ?? null

  const { data: bookings } = serviceId
    ? await supabase
        .from('booking_requests')
        .select(
          'id, event_date, event_type, status, event_location, guest_count, description, planner_id, created_at, users!planner_id(name, avatar_url)'
        )
        .eq('service_id', serviceId)
        .in('status', ['accepted', 'completed'])
        .order('created_at', { ascending: false })
    : { data: [] }

  const threadsRaw = await Promise.all(
    (bookings ?? []).map(async booking => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, image_url, created_at, sender_id')
        .eq('booking_request_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: unread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('booking_request_id', booking.id)
        .is('read_at', null)
        .neq('sender_id', user.id)

      const planner = (
        Array.isArray(booking.users) ? booking.users[0] : booking.users
      ) as { name: string | null; avatar_url: string | null } | null
      const name = planner?.name ?? 'Arrangör'
      const lastText = lastMsg
        ? lastMsg.sender_id === user.id
          ? `Du: ${lastMsg.content ?? '📷 Bild'}`
          : lastMsg.content ?? '📷 Bild'
        : 'Ingen konversation än'

      const thread: InboxThread = {
        id: booking.id,
        name,
        subtitle: formatEventType(booking.event_type),
        lastText,
        lastAt: lastMsg?.created_at ?? null,
        unread: unread ?? 0,
      }
      return { thread, booking, planner }
    })
  )

  const threads = threadsRaw.map(t => t.thread)
  const activeId = searchParams.c ?? null
  const active = activeId ? threadsRaw.find(t => t.thread.id === activeId) : null

  let embeddedThread: ReactNode = null
  let details: ReactNode = null

  if (active) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('booking_request_id', active.booking.id)
      .is('read_at', null)
      .neq('sender_id', user.id)

    const messages = await fetchMessagesWithReadReceiptPrivacy(
      supabase,
      active.booking.id,
      user.id,
      active.booking.planner_id
    )

    embeddedThread = (
      <MessageThread
        bookingId={active.booking.id}
        currentUserId={user.id}
        messages={messages}
        otherName={active.thread.name}
        isPlanner={false}
        isProvider
        isCompleted={active.booking.status === 'completed'}
        eventDate={active.booking.event_date ?? null}
        eventLocation={active.booking.event_location ?? null}
        guestCount={active.booking.guest_count ?? null}
        eventType={active.booking.event_type ?? null}
        inquiryAt={active.booking.created_at ?? null}
        serviceId={serviceId}
        serviceTitle={result.service?.title ?? null}
        embedded
      />
    )

    details = (
      <ConversationDetails
        inboxPath="/dashboard/messages"
        booking={{
          id: active.booking.id,
          status: active.booking.status,
          event_date: active.booking.event_date,
          event_type: active.booking.event_type,
          event_location: active.booking.event_location,
          guest_count: active.booking.guest_count,
          description: active.booking.description,
        }}
        side={{
          role: 'provider',
          plannerName: active.thread.name,
          plannerAvatarUrl: active.planner?.avatar_url ?? null,
        }}
      />
    )
  }

  return (
    <ProviderHostShell flush>
      <MessagesPanel
        userId={user.id}
        threads={threads}
        activeId={activeId}
        inboxPath="/dashboard/messages"
        threadPath="/booking/:id/messages"
        conversation={embeddedThread}
        details={details}
        accent="ink"
        fillParent
      />
    </ProviderHostShell>
  )
}
