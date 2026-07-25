import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const [{ data: userData }, { data: profile }] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase.from('provider_profiles').select('id, service_title').eq('user_id', user.id).maybeSingle(),
  ])

  if (!profile) return await redirectWithoutProviderProfile(supabase, user.id)

  const [{ data: reviews }, { count: pendingRequests }, { data: bookingIds }] = await Promise.all([
    supabase.from('reviews').select('id, rating, comment, created_at, users!reviewer_id(name)').eq('provider_profile_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('provider_profile_id', profile.id).eq('status', 'pending'),
    supabase.from('booking_requests').select('id').eq('provider_profile_id', profile.id),
  ])

  const requestIds = (bookingIds ?? []).map(r => r.id)
  const { count: unreadMessages } = requestIds.length > 0
    ? await supabase.from('messages').select('*', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', user.id).in('booking_request_id', requestIds)
    : { count: 0 }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

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
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#222222]">Recensioner</h1>
          {reviews && reviews.length > 0 && (
            <p className="text-sm text-[#6A6A6A] mt-1">{reviews.length} {reviews.length === 1 ? 'recension' : 'recensioner'}</p>
          )}
        </div>

        {/* Average rating banner */}
        {avgRating !== null && (
          <div className="mb-6 bg-[#222222] rounded-2xl px-8 py-6 flex items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
              <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.round(avgRating) ? '#FF6B35' : 'none'} stroke="#FF6B35" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <p className="text-sm text-white/60">
              Snittbetyg av {reviews!.length} {reviews!.length === 1 ? 'recension' : 'recensioner'}
            </p>
          </div>
        )}

        {!reviews || reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EBEBEB] py-20 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-base font-semibold text-[#222222] mb-2">Inga recensioner ännu</p>
            <p className="text-sm text-[#6A6A6A]">Recensioner visas här när kunder har betygsatt dig.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#222222]">{(review.users as any)?.name ?? 'Anonym'}</p>
                    <p className="text-xs text-[#6A6A6A] mt-0.5">
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
                  <p className="text-sm text-[#6A6A6A] leading-relaxed border-l-2 border-[#EBEBEB] pl-3">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
