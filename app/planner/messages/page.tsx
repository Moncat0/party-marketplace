import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import GuestAppChrome from '@/components/GuestAppChrome'
import MessagesPanel from '@/components/messages/MessagesPanel'
import { type InboxThread } from '@/components/MessagesInbox'
import MessageThread from '@/app/booking/[id]/messages/MessageThread'

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

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      'id, event_date, event_type, status, event_location, provider_profiles!provider_profile_id(user_id, service_title, users(name))'
    )
    .eq('planner_id', user.id)
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })

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

      const profile = (
        Array.isArray(booking.provider_profiles)
          ? booking.provider_profiles[0]
          : booking.provider_profiles
      ) as unknown as {
        user_id: string
        service_title: string | null
        users: { name: string | null } | { name: string | null }[] | null
      } | null

      const userRow = profile?.users
        ? Array.isArray(profile.users)
          ? profile.users[0]
          : profile.users
        : null
      const name = userRow?.name ?? profile?.service_title ?? 'Talang'
      const lastText = lastMsg
        ? lastMsg.sender_id === user.id
          ? `Du: ${lastMsg.content ?? '📷 Bild'}`
          : lastMsg.content ?? '📷 Bild'
        : 'Ingen konversation än'

      const thread: InboxThread = {
        id: booking.id,
        name,
        subtitle: profile?.service_title && userRow?.name ? profile.service_title : null,
        lastText,
        lastAt: lastMsg?.created_at ?? null,
        unread: unread ?? 0,
      }
      return { thread, booking, profile }
    })
  )

  const threads = threadsRaw.map(t => t.thread)
  const activeId = searchParams.c ?? null
  const active = activeId ? threadsRaw.find(t => t.thread.id === activeId) : null

  let embeddedThread: ReactNode = null
  if (active) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*, users!sender_id(name), quotes(*)')
      .eq('booking_request_id', active.booking.id)
      .order('created_at', { ascending: true })

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('booking_request_id', active.booking.id)
      .is('read_at', null)
      .neq('sender_id', user.id)

    embeddedThread = (
      <MessageThread
        bookingId={active.booking.id}
        currentUserId={user.id}
        messages={messages ?? []}
        otherName={active.thread.name}
        isPlanner
        isProvider={false}
        isCompleted={active.booking.status === 'completed'}
        eventDate={active.booking.event_date ?? null}
        eventLocation={active.booking.event_location ?? null}
        embedded
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
      />
    </GuestAppChrome>
  )
}
