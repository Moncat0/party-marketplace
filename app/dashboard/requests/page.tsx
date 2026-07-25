import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import RequestsList from './RequestsList'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const [{ data: userData }, { data: profile }] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase.from('provider_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  if (!profile) return await redirectWithoutProviderProfile(supabase, user.id)

  const [{ data: requests }, { count: pendingRequests }, { data: bookingIds }] = await Promise.all([
    supabase.from('booking_requests').select('*, users!planner_id(id, name, email)').eq('provider_profile_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('provider_profile_id', profile.id).eq('status', 'pending'),
    supabase.from('booking_requests').select('id').eq('provider_profile_id', profile.id),
  ])

  const requestIds = (bookingIds ?? []).map(r => r.id)
  const { count: unreadMessages } = requestIds.length > 0
    ? await supabase.from('messages').select('*', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', user.id).in('booking_request_id', requestIds)
    : { count: 0 }

  const navItems = [
    { href: '/dashboard', label: 'Översikt', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { href: '/dashboard/requests', label: 'Förfrågningar', badge: pendingRequests, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { href: '/dashboard/messages', label: 'Meddelanden', badge: unreadMessages, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/dashboard/reviews', label: 'Recensioner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { href: '/dashboard/profile', label: 'Redigera profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
    { href: '/dashboard/account', label: 'Inställningar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  return (
    <DashboardShell
      name={userData?.name ?? null}
      role="provider"
      navItems={navItems}
      modeSwitcher={{ href: '/planner/dashboard', label: 'Byt till planerarläge' }}
    >
      <RequestsList requests={requests ?? []} />
    </DashboardShell>
  )
}
