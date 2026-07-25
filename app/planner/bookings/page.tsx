import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import PayButton from '@/components/PayButton'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Väntar på svar',
  accepted: 'Bekräftad',
  declined: 'Avböjd',
  completed: 'Avslutad',
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  birthday: 'Födelsedag',
  wedding: 'Bröllop',
  corporate: 'Företagsevent',
  kids: 'Barnkalas',
  other: 'Annat',
}

export default async function PlannerBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const [{ data: userData }, { data: providerProfile }, { data: bookings }] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase.from('provider_profiles').select('id').eq('user_id', user.id).single(),
    supabase.from('booking_requests')
      .select('*, price_ore, payment_status, provider_profiles!provider_profile_id(id, service_title, stripe_onboarded, users(name))')
      .eq('planner_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const activeIds = (bookings ?? []).filter(b => b.status === 'accepted' || b.status === 'completed').map(b => b.id)
  const { count: unreadMessages } = activeIds.length > 0
    ? await supabase.from('messages').select('*', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', user.id).in('booking_request_id', activeIds)
    : { count: 0 }

  const pendingCount = (bookings ?? []).filter(b => b.status === 'pending').length
  const now = new Date()

  const navItems = [
    { href: '/planner/dashboard', label: 'Översikt', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { href: '/planner/messages', label: 'Meddelanden', badge: unreadMessages, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
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
      <div className="max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Mina bokningar</h1>
            <p className="text-sm text-[#717171] mt-1">{bookings?.length ?? 0} totalt</p>
          </div>
          <Link href="/" className="rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors">
            + Boka ny talang
          </Link>
        </div>

        {!bookings?.length ? (
          <div className="bg-white rounded-2xl border border-[#EBEBEB] py-20 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-base font-semibold text-[#1A1A2E] mb-2">Inga bokningar än</p>
            <p className="text-sm text-[#717171] mb-6">Du har inte skickat några förfrågningar än.</p>
            <Link href="/" className="inline-block rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors">
              Hitta underhållning →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB] overflow-hidden">
            {bookings.map(booking => {
              const profile = booking.provider_profiles as { id: string; service_title: string | null; stripe_onboarded: boolean; users: { name: string | null } | null } | null
              const providerName = profile?.users?.name ?? profile?.service_title ?? 'Okänd'
              const eventPast = booking.event_date ? new Date(booking.event_date) < now : false
              const canReview = (booking.status === 'accepted' || booking.status === 'completed') && eventPast
              const canChat = (booking.status === 'accepted' || booking.status === 'completed')
              const needsPayment = booking.status === 'accepted' && booking.payment_status === 'unpaid' && booking.price_ore && profile?.stripe_onboarded
              const awaitingStripe = booking.status === 'accepted' && booking.payment_status === 'unpaid' && booking.price_ore && !profile?.stripe_onboarded

              return (
                <div key={booking.id} className="px-6 py-5 flex items-center gap-5">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#FF6B35]">{providerName.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[#1A1A2E] truncate">{profile?.service_title ?? 'Tjänst'}</p>
                      <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        booking.status === 'accepted' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' :
                        booking.status === 'declined' ? 'bg-[#F7F7F7] text-[#717171]' :
                        booking.status === 'completed' ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]' :
                        'bg-[#FF6B35]/10 text-[#FF6B35]'
                      }`}>
                        {STATUS_LABEL[booking.status] ?? booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs text-[#717171]">{providerName}</p>
                      {booking.event_date && (
                        <p className="text-xs text-[#717171]">
                          {new Date(booking.event_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {booking.event_type && (
                        <p className="text-xs text-[#717171]">{EVENT_TYPE_LABEL[booking.event_type] ?? booking.event_type}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {needsPayment && (
                      <PayButton bookingId={booking.id} priceOre={booking.price_ore!} />
                    )}
                    {awaitingStripe && (
                      <span className="text-xs text-[#717171] max-w-[160px] text-right">Väntar på att talangen ansluter betalning</span>
                    )}
                    {canReview && (
                      <Link href={`/review/${booking.id}`}
                        className="rounded-xl bg-[#FF6B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e55a26] transition-colors">
                        ⭐ Omdöme
                      </Link>
                    )}
                    {canChat && (
                      <Link href={`/booking/${booking.id}/messages`}
                        className="rounded-xl border border-[#EBEBEB] px-4 py-2 text-xs font-medium text-[#1A1A2E] hover:bg-[#F7F7F7] transition-colors">
                        Chatt →
                      </Link>
                    )}
                    {booking.status === 'pending' && (
                      <span className="text-xs text-[#717171]">Väntar...</span>
                    )}
                    {booking.status === 'declined' && (
                      <Link href="/" className="rounded-xl border border-[#EBEBEB] px-4 py-2 text-xs font-medium text-[#1A1A2E] hover:bg-[#F7F7F7] transition-colors">
                        Hitta annan →
                      </Link>
                    )}
                    {booking.payment_status === 'paid' && (
                      <span className="rounded-full bg-[#1D9E75]/10 text-[#1D9E75] px-3 py-1 text-xs font-medium">Betald ✓</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
