import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GuestAppChrome from '@/components/GuestAppChrome'
import { settingsTokens as t } from '@/components/settings/tokens'

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
  const firstName = userData?.name?.split(' ')[0]

  return (
    <GuestAppChrome>
      <header className="mb-8">
        <h1 className="text-[32px] font-medium leading-[1.125] tracking-[-0.8px] text-[#222222]">
          Hej{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[14px] text-[#6a6a6a] mt-2">Din översikt som planerare</p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { value: totalBookings, label: 'Totala bokningar', color: t.colors.ink },
          { value: pendingCount, label: 'Väntande svar', color: t.colors.primary },
          { value: unreadMessages ?? 0, label: 'Olästa meddelanden', color: t.colors.ink },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-5 bg-white"
            style={{ borderRadius: t.rounded.md, border: `1px solid ${t.colors.hairline}` }}
          >
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-[14px] text-[#6a6a6a] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {awaitingReview.length > 0 && (
        <div
          className="mb-6 px-6 py-5"
          style={{
            borderRadius: t.rounded.md,
            backgroundColor: 'rgba(255, 107, 53, 0.08)',
            border: '1px solid rgba(255, 107, 53, 0.2)',
          }}
        >
          <p className="font-semibold text-[#222222] mb-1">Hur gick festen?</p>
          <p className="text-[14px] text-[#6a6a6a] mb-4">
            {awaitingReview.length === 1
              ? 'Ett evenemang'
              : `${awaitingReview.length} evenemang`}{' '}
            väntar på ditt omdöme.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            href: '/planner/bookings',
            title: 'Mina bokningar',
            desc: 'Se och hantera dina förfrågningar',
            badge: pendingCount > 0 ? `${pendingCount} nya` : null,
          },
          {
            href: '/planner/messages',
            title: 'Meddelanden',
            desc: 'Konversationer med talanger',
            badge: (unreadMessages ?? 0) > 0 ? `${unreadMessages} nya` : null,
          },
          {
            href: '/planner/shortlist',
            title: 'Önskelistor',
            desc: 'Din lista med favoriter',
            badge: null,
          },
        ].map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="block p-6 bg-white hover:bg-[#f7f7f7] transition-colors"
            style={{ borderRadius: t.rounded.md, border: `1px solid ${t.colors.hairline}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-[#222222]">{card.title}</p>
              {card.badge && (
                <span className="rounded-full bg-[#FF6B35] px-2.5 py-0.5 text-xs font-semibold text-white">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#6a6a6a]">{card.desc}</p>
          </Link>
        ))}
        <Link
          href="/"
          className="block p-6 bg-[#222222] hover:bg-[#111111] transition-colors"
          style={{ borderRadius: t.rounded.md }}
        >
          <p className="font-semibold text-white">Hitta underhållning</p>
          <p className="text-[14px] text-white/60 mt-0.5">Bläddra bland talanger i Stockholm</p>
        </Link>
      </div>
    </GuestAppChrome>
  )
}
