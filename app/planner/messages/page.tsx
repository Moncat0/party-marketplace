import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function PlannerMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single()

  const { data: providerProfile } = await supabase
    .from('provider_profiles').select('id').eq('user_id', user.id).single()

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, event_date, event_type, status, provider_profiles!provider_profile_id(service_title, users(name))')
    .eq('planner_id', user.id)
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })

  const threads = await Promise.all(
    (bookings ?? []).map(async (booking) => {
      const { data: lastMsg } = await supabase
        .from('messages').select('content, image_url, created_at, sender_id')
        .eq('booking_request_id', booking.id)
        .order('created_at', { ascending: false }).limit(1).single()

      const { count: unread } = await supabase
        .from('messages').select('*', { count: 'exact', head: true })
        .eq('booking_request_id', booking.id).is('read_at', null).neq('sender_id', user.id)

      return { ...booking, lastMsg, unread: unread ?? 0 }
    })
  )

  const { count: pendingCount } = await supabase
    .from('booking_requests').select('*', { count: 'exact', head: true })
    .eq('planner_id', user.id).eq('status', 'pending')

  const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0)

  const navItems = [
    { href: '/planner/dashboard', label: 'Översikt', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { href: '/planner/messages', label: 'Meddelanden', badge: unreadTotal, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/planner/bookings', label: 'Mina bokningar', badge: pendingCount, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { href: '/planner/reviews', label: 'Mina recensioner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { href: '/planner/shortlist', label: 'Sparade talanger', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { href: '/planner/account', label: 'Inställningar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  return (
    <DashboardShell
      name={userData?.name ?? null}
      role="planner"
      navItems={navItems}
      modeSwitcher={providerProfile
        ? { href: '/dashboard', label: 'Byt till talangläge' }
        : { href: '/onboarding', label: 'Erbjud din tjänst' }}
    >
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Meddelanden</h1>
          <p className="text-sm text-[#717171] mt-1">{threads.length} {threads.length === 1 ? 'konversation' : 'konversationer'}</p>
        </div>

        {threads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EBEBEB] py-16 text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-base font-semibold text-[#1A1A2E] mb-2">Inga meddelanden än</p>
            <p className="text-sm text-[#717171] mb-6">När en talang accepterar din förfrågan kan ni chatta här.</p>
            <Link href="/" className="inline-block rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors">
              Hitta underhållning →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB] overflow-hidden">
            {threads.map(thread => {
              const profile = (Array.isArray(thread.provider_profiles) ? thread.provider_profiles[0] : thread.provider_profiles) as unknown as { service_title: string | null; users: { name: string | null } | null } | null
              const name = profile?.users?.name ?? profile?.service_title ?? 'Talang'
              const hasUnread = thread.unread > 0
              const lastText = thread.lastMsg
                ? thread.lastMsg.sender_id === user.id
                  ? `Du: ${thread.lastMsg.content ?? '📷 Bild'}`
                  : thread.lastMsg.content ?? '📷 Bild'
                : 'Ingen konversation än'

              return (
                <Link key={thread.id} href={`/booking/${thread.id}/messages`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#F7F7F7] transition-colors"
                >
                  <div className="h-11 w-11 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#FF6B35]">{name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm ${hasUnread ? 'font-semibold text-[#1A1A2E]' : 'font-medium text-[#1A1A2E]'}`}>{name}</p>
                      {thread.lastMsg && (
                        <p className="text-xs text-[#717171] flex-shrink-0">
                          {new Date(thread.lastMsg.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <p className={`text-sm truncate ${hasUnread ? 'text-[#1A1A2E]' : 'text-[#717171]'}`}>{lastText}</p>
                    {profile?.service_title && profile.users?.name && (
                      <p className="text-xs text-[#A0A0A0] truncate mt-0.5">{profile.service_title}</p>
                    )}
                  </div>
                  {hasUnread && (
                    <span className="h-5 w-5 rounded-full bg-[#FF6B35] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {thread.unread}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
