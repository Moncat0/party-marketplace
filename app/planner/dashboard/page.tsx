import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function PlannerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: providerProfile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, status, event_date')
    .eq('planner_id', user.id)

  const now = new Date()
  const pendingCount = bookings?.filter(b => b.status === 'pending').length ?? 0
  const activeIds = (bookings ?? [])
    .filter(b => b.status === 'accepted' || b.status === 'completed')
    .map(b => b.id)

  const { count: unreadMessages } = activeIds.length > 0
    ? await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null)
        .neq('sender_id', user.id)
        .in('booking_request_id', activeIds)
    : { count: 0 }

  const awaitingReview = (bookings ?? []).filter(b =>
    (b.status === 'accepted' || b.status === 'completed') &&
    b.event_date && new Date(b.event_date) < now
  )

  const totalBookings = bookings?.length ?? 0

  const navItems = [
    {
      href: '/planner/dashboard',
      label: 'Översikt',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      href: '/planner/messages',
      label: 'Meddelanden',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      badge: unreadMessages,
    },
    {
      href: '/planner/bookings',
      label: 'Mina bokningar',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      badge: pendingCount,
    },
    {
      href: '/planner/reviews',
      label: 'Mina recensioner',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    },
    {
      href: '/planner/shortlist',
      label: 'Sparade talanger',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    },
    {
      href: '/planner/account',
      label: 'Inställningar',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    },
  ]

  return (
    <DashboardShell
      name={userData?.name ?? null}
      role="planner"
      navItems={navItems}
      modeSwitcher={providerProfile
        ? { href: '/dashboard', label: 'Byt till talangläge' }
        : { href: '/onboarding', label: 'Erbjud din tjänst' }
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <p className="text-3xl font-bold text-[#1A1A2E]">{totalBookings}</p>
          <p className="text-sm text-[#717171] mt-1">Totala bokningar</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <p className="text-3xl font-bold text-[#FF6B35]">{pendingCount}</p>
          <p className="text-sm text-[#717171] mt-1">Väntande svar</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <p className="text-3xl font-bold text-[#1A1A2E]">{unreadMessages ?? 0}</p>
          <p className="text-sm text-[#717171] mt-1">Olästa meddelanden</p>
        </div>
      </div>

      {/* Review nudge */}
      {awaitingReview.length > 0 && (
        <div className="mb-6 rounded-2xl bg-[#FF6B35]/8 border border-[#FF6B35]/20 px-6 py-5">
          <p className="font-semibold text-[#1A1A2E] mb-1">
            ⭐ Hur gick festen?
          </p>
          <p className="text-sm text-[#717171] mb-4">
            {awaitingReview.length === 1 ? 'Ett evenemang' : `${awaitingReview.length} evenemang`} väntar på ditt omdöme.
          </p>
          <div className="flex gap-3 flex-wrap">
            {awaitingReview.map(b => (
              <Link
                key={b.id}
                href={`/review/${b.id}`}
                className="rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
              >
                Lämna omdöme →
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/planner/bookings" className="group bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#FF6B35]/30 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📋</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-[#FF6B35] px-2.5 py-0.5 text-xs font-semibold text-white">{pendingCount} nya</span>
            )}
          </div>
          <p className="font-semibold text-[#1A1A2E]">Mina bokningar</p>
          <p className="text-sm text-[#717171] mt-0.5">Se och hantera dina förfrågningar</p>
        </Link>

        <Link href="/planner/messages" className="group bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#FF6B35]/30 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💬</span>
            {(unreadMessages ?? 0) > 0 && (
              <span className="rounded-full bg-[#FF6B35] px-2.5 py-0.5 text-xs font-semibold text-white">{unreadMessages} nya</span>
            )}
          </div>
          <p className="font-semibold text-[#1A1A2E]">Meddelanden</p>
          <p className="text-sm text-[#717171] mt-0.5">Konversationer med talanger</p>
        </Link>

        <Link href="/planner/shortlist" className="group bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#FF6B35]/30 hover:shadow-sm transition-all">
          <div className="mb-3 text-2xl">❤️</div>
          <p className="font-semibold text-[#1A1A2E]">Sparade talanger</p>
          <p className="text-sm text-[#717171] mt-0.5">Din lista med favoriter</p>
        </Link>

        <Link href="/" className="group bg-[#1A1A2E] rounded-2xl p-6 border border-transparent hover:bg-[#2d2d4e] transition-all">
          <div className="mb-3 text-2xl">🔍</div>
          <p className="font-semibold text-white">Hitta underhållning</p>
          <p className="text-sm text-white/60 mt-0.5">Bläddra bland talanger i Stockholm</p>
        </Link>
      </div>
    </DashboardShell>
  )
}
