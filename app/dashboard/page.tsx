import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, service_title, is_published, stripe_onboarded')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return await redirectWithoutProviderProfile(supabase, user.id)

  const { count: pendingRequests } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('provider_profile_id', profile.id)
    .eq('status', 'pending')

  const { count: totalRequests } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('provider_profile_id', profile.id)

  const { data: bookingIds } = await supabase
    .from('booking_requests')
    .select('id')
    .eq('provider_profile_id', profile.id)

  const requestIds = (bookingIds ?? []).map(r => r.id)

  const { count: unreadMessages } = requestIds.length > 0
    ? await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null)
        .neq('sender_id', user.id)
        .in('booking_request_id', requestIds)
    : { count: 0 }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Översikt',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      href: '/dashboard/requests',
      label: 'Förfrågningar',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      badge: pendingRequests,
    },
    {
      href: '/dashboard/messages',
      label: 'Meddelanden',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      badge: unreadMessages,
    },
    {
      href: '/dashboard/reviews',
      label: 'Recensioner',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    },
    {
      href: '/dashboard/profile',
      label: 'Redigera profil',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    },
    {
      href: '/dashboard/account',
      label: 'Inställningar',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    },
  ]

  return (
    <DashboardShell
      name={userData?.name ?? null}
      role="provider"
      navItems={navItems}
      modeSwitcher={{ href: '/planner/dashboard', label: 'Byt till planerarläge' }}
    >
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <p className="text-3xl font-bold text-[#222222]">{totalRequests ?? 0}</p>
          <p className="text-sm text-[#6A6A6A] mt-1">Totala förfrågningar</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <p className="text-3xl font-bold text-[#FF6B35]">{pendingRequests ?? 0}</p>
          <p className="text-sm text-[#6A6A6A] mt-1">Inväntar svar</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <p className="text-3xl font-bold text-[#222222]">{unreadMessages ?? 0}</p>
          <p className="text-sm text-[#6A6A6A] mt-1">Olästa meddelanden</p>
        </div>
      </div>

      {/* Stripe Connect banner */}
      {!profile.stripe_onboarded && (
        <div className="mb-6 rounded-2xl px-6 py-4 flex items-center justify-between border bg-[#222222]/5 border-[#222222]/10">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <div>
              <p className="font-semibold text-[#222222] text-sm">Anslut ditt bankkonto</p>
              <p className="text-xs text-[#6A6A6A]">För att ta emot betalningar via FESTEN. behöver du ansluta Stripe.</p>
            </div>
          </div>
          <a
            href="/api/stripe/connect"
            className="flex-shrink-0 rounded-xl bg-[#222222] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111111] transition-colors"
          >
            Anslut Stripe →
          </a>
        </div>
      )}

      {/* Profile status banner */}
      <div className={`mb-6 rounded-2xl px-6 py-4 flex items-center justify-between border ${
        profile.is_published
          ? 'bg-[#1D9E75]/8 border-[#1D9E75]/20'
          : 'bg-[#FF6B35]/8 border-[#FF6B35]/20'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${profile.is_published ? 'bg-[#1D9E75]' : 'bg-[#FF6B35]'}`} />
          <div>
            <p className="font-semibold text-[#222222] text-sm">
              {profile.is_published ? 'Din profil är publicerad' : 'Din profil är inte publicerad ännu'}
            </p>
            <p className="text-xs text-[#6A6A6A]">
              {profile.service_title ?? 'Talangprofil'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {profile.is_published && (
            <Link
              href={`/providers/${profile.id}`}
              className="rounded-xl border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-[#222222] hover:bg-[#F2F2F2] transition-colors"
            >
              Visa profil →
            </Link>
          )}
          <Link
            href="/dashboard/profile"
            className="rounded-xl bg-[#222222] px-4 py-2 text-sm font-medium text-white hover:bg-[#111111] transition-colors"
          >
            Redigera
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/requests" className="group bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#FF6B35]/30 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📋</span>
            {(pendingRequests ?? 0) > 0 && (
              <span className="rounded-full bg-[#FF6B35] px-2.5 py-0.5 text-xs font-semibold text-white">{pendingRequests} nya</span>
            )}
          </div>
          <p className="font-semibold text-[#222222]">Förfrågningar</p>
          <p className="text-sm text-[#6A6A6A] mt-0.5">Acceptera eller neka bokningar</p>
        </Link>

        <Link href="/dashboard/messages" className="group bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#FF6B35]/30 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💬</span>
            {(unreadMessages ?? 0) > 0 && (
              <span className="rounded-full bg-[#FF6B35] px-2.5 py-0.5 text-xs font-semibold text-white">{unreadMessages} nya</span>
            )}
          </div>
          <p className="font-semibold text-[#222222]">Meddelanden</p>
          <p className="text-sm text-[#6A6A6A] mt-0.5">Konversationer med planerare</p>
        </Link>

        <Link href="/dashboard/reviews" className="group bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#FF6B35]/30 hover:shadow-sm transition-all">
          <div className="mb-3 text-2xl">⭐</div>
          <p className="font-semibold text-[#222222]">Recensioner</p>
          <p className="text-sm text-[#6A6A6A] mt-0.5">Vad säger dina kunder?</p>
        </Link>

        <Link href="/dashboard/profile" className="group bg-[#222222] rounded-2xl p-6 border border-transparent hover:bg-[#111111] transition-all">
          <div className="mb-3 text-2xl">✏️</div>
          <p className="font-semibold text-white">Redigera profil</p>
          <p className="text-sm text-white/60 mt-0.5">Uppdatera bilder och beskrivning</p>
        </Link>
      </div>
    </DashboardShell>
  )
}
