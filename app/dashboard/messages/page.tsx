import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import DashboardShell from '@/components/DashboardShell'
import MessagesPanel from '@/components/messages/MessagesPanel'
import { type InboxThread } from '@/components/MessagesInbox'
import MessageThread from '@/app/booking/[id]/messages/MessageThread'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

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

  const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single()

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, service_title, is_published')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return await redirectWithoutProviderProfile(supabase, user.id)

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, event_date, event_type, status, event_location, users!planner_id(name)')
    .eq('provider_profile_id', profile.id)
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

      const planner = (
        Array.isArray(booking.users) ? booking.users[0] : booking.users
      ) as { name: string | null } | null
      const name = planner?.name ?? 'Arrangör'
      const lastText = lastMsg
        ? lastMsg.sender_id === user.id
          ? `Du: ${lastMsg.content ?? '📷 Bild'}`
          : lastMsg.content ?? '📷 Bild'
        : 'Ingen konversation än'

      const thread: InboxThread = {
        id: booking.id,
        name,
        subtitle: booking.event_type,
        lastText,
        lastAt: lastMsg?.created_at ?? null,
        unread: unread ?? 0,
      }
      return { thread, booking }
    })
  )

  const threads = threadsRaw.map(t => t.thread)
  const unreadTotal = threads.reduce((sum, th) => sum + th.unread, 0)
  const activeId = searchParams.c ?? null
  const active = activeId ? threadsRaw.find(t => t.thread.id === activeId) : null

  const { count: pendingRequests } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('provider_profile_id', profile.id)
    .eq('status', 'pending')

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
        isPlanner={false}
        isProvider
        isCompleted={active.booking.status === 'completed'}
        eventDate={active.booking.event_date ?? null}
        eventLocation={active.booking.event_location ?? null}
        embedded
      />
    )
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Översikt',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: '/dashboard/requests',
      label: 'Förfrågningar',
      badge: pendingRequests,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      href: '/dashboard/messages',
      label: 'Meddelanden',
      badge: unreadTotal,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/reviews',
      label: 'Recensioner',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      href: '/dashboard/profile',
      label: 'Redigera profil',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/account',
      label: 'Inställningar',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardShell
      name={userData?.name ?? null}
      role="provider"
      navItems={navItems}
      modeSwitcher={{ href: '/planner/dashboard', label: 'Byt till planerarläge' }}
      flush
    >
      <MessagesPanel
        userId={user.id}
        threads={threads}
        activeId={activeId}
        inboxPath="/dashboard/messages"
        threadPath="/booking/:id/messages"
        conversation={embeddedThread}
        accent="ink"
        fillParent
      />
    </DashboardShell>
  )
}
