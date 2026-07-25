import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function PlannerReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const [{ data: userData }, { data: providerProfile }, { data: reviews }] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase.from('provider_profiles').select('id').eq('user_id', user.id).single(),
    supabase.from('reviews')
      .select('id, rating, comment, created_at, reviewee_id, booking_request_id, users!reviewee_id(name)')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const activeBookingIds: string[] = []
  const { count: unreadMessages } = activeBookingIds.length > 0
    ? await supabase.from('messages').select('*', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', user.id).in('booking_request_id', activeBookingIds)
    : { count: 0 }

  const navItems = [
    { href: '/planner/dashboard', label: 'Översikt', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { href: '/planner/messages', label: 'Meddelanden', badge: unreadMessages, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/planner/bookings', label: 'Mina bokningar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Mina recensioner</h1>
          <p className="text-sm text-[#717171] mt-1">
            {reviews?.length ?? 0} {(reviews?.length ?? 0) === 1 ? 'recension' : 'recensioner'} skrivna
          </p>
        </div>

        {!reviews?.length ? (
          <div className="bg-white rounded-2xl border border-[#EBEBEB] py-20 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-base font-semibold text-[#1A1A2E] mb-2">Inga recensioner än</p>
            <p className="text-sm text-[#717171] mb-6">De dyker upp här efter att du har bokat och lämnat ett omdöme.</p>
            <Link href="/" className="inline-block rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors">
              Hitta underhållning →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {reviews.map(review => {
              const reviewee = (Array.isArray(review.users) ? review.users[0] : review.users) as { name: string | null } | null
              return (
                <div key={review.id} className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{reviewee?.name ?? 'Talang'}</p>
                      <p className="text-xs text-[#717171] mt-0.5">
                        {new Date(review.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < review.rating ? '#FF6B35' : 'none'} stroke="#FF6B35" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[#717171] leading-relaxed">{review.comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
