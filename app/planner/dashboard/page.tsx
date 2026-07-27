import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import GuestAppChrome from '@/components/GuestAppChrome'
import {
  OverviewActionGrid,
  OverviewBanner,
  OverviewBannerButton,
  OverviewGreeting,
  OverviewStatGrid,
} from '@/components/dashboard/OverviewUI'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Översikt' }

export default async function PlannerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single()

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, status, event_date')
    .eq('planner_id', user.id)

  const now = new Date()
  const pendingCount = bookings?.filter(b => b.status === 'pending').length ?? 0
  const activeIds = (bookings ?? [])
    .filter(b => b.status === 'accepted' || b.status === 'completed')
    .map(b => b.id)

  const { count: unreadMessages } =
    activeIds.length > 0
      ? await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .is('read_at', null)
          .neq('sender_id', user.id)
          .in('booking_request_id', activeIds)
      : { count: 0 }

  const awaitingReview = (bookings ?? []).filter(
    b =>
      (b.status === 'accepted' || b.status === 'completed') &&
      b.event_date &&
      new Date(b.event_date) < now
  )

  const totalBookings = bookings?.length ?? 0

  return (
    <GuestAppChrome>
      <OverviewGreeting name={userData?.name} subtitle="Din översikt som planerare" />

      <OverviewStatGrid
        stats={[
          { value: totalBookings, label: 'Totala bokningar' },
          { value: pendingCount, label: 'Väntande svar', emphasize: true },
          { value: unreadMessages ?? 0, label: 'Olästa meddelanden' },
        ]}
      />

      {awaitingReview.length > 0 && (
        <OverviewBanner
          variant="primary"
          title="Hur gick festen?"
          description={
            awaitingReview.length === 1
              ? 'Ett evenemang väntar på ditt omdöme.'
              : `${awaitingReview.length} evenemang väntar på ditt omdöme.`
          }
        >
          {awaitingReview.slice(0, 3).map(b => (
            <OverviewBannerButton key={b.id} href={`/review/${b.id}`} variant="primary">
              Lämna omdöme →
            </OverviewBannerButton>
          ))}
        </OverviewBanner>
      )}

      <OverviewActionGrid
        actions={[
          {
            href: '/planner/bookings',
            title: 'Mina bokningar',
            description: 'Se och hantera dina förfrågningar',
            badge: pendingCount > 0 ? `${pendingCount} nya` : null,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            ),
          },
          {
            href: '/planner/messages',
            title: 'Meddelanden',
            description: 'Konversationer med talanger',
            badge: (unreadMessages ?? 0) > 0 ? `${unreadMessages} nya` : null,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
          },
          {
            href: '/planner/shortlist',
            title: 'Önskelistor',
            description: 'Din lista med favoriter',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ),
          },
          {
            href: '/',
            title: 'Hitta underhållning',
            description: 'Bläddra bland talanger i Stockholm',
            featured: true,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            ),
          },
        ]}
      />
    </GuestAppChrome>
  )
}
