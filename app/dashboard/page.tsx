import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import {
  OverviewActionGrid,
  OverviewBanner,
  OverviewBannerButton,
  OverviewGreeting,
  OverviewStatGrid,
} from '@/components/dashboard/OverviewUI'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServicesForUser, isServicePubliclyListed } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Översikt' }

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard')

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const result = await getServicesForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const { provider, services, service } = result
  const serviceIds = services.map(s => s.id)
  const publishedCount = services.filter(isServicePubliclyListed).length
  const hasAnyPublished = services.some(s => s.is_published)

  const todayIso = new Date().toISOString().slice(0, 10)

  const [
    { count: pendingRequests },
    { count: totalRequests },
    { count: unreadMessages },
    { count: todayCount },
    { count: upcomingCount },
  ] = serviceIds.length
    ? await Promise.all([
        supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .in('service_id', serviceIds)
          .eq('status', 'pending'),
        supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .in('service_id', serviceIds),
        (async () => {
          const { data: bookingIds } = await supabase
            .from('booking_requests')
            .select('id')
            .in('service_id', serviceIds)
          const ids = (bookingIds ?? []).map(r => r.id)
          if (!ids.length) return { count: 0 }
          return supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .is('read_at', null)
            .neq('sender_id', user.id)
            .in('booking_request_id', ids)
        })(),
        supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .in('service_id', serviceIds)
          .eq('status', 'accepted')
          .eq('event_date', todayIso),
        supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .in('service_id', serviceIds)
          .eq('status', 'accepted')
          .gt('event_date', todayIso),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }]

  return (
    <ProviderHostShell>
      <OverviewGreeting name={userData?.name} subtitle="Översikt för ditt talangkonto" />

      <OverviewStatGrid
        stats={[
          { value: pendingRequests ?? 0, label: 'Nya förfrågningar', emphasize: true },
          { value: todayCount ?? 0, label: 'Bokningar idag' },
          { value: upcomingCount ?? 0, label: 'Kommande bokningar' },
        ]}
      />

      {!provider.stripe_onboarded && (
        <OverviewBanner
          variant="neutral"
          title="Anslut ditt bankkonto"
          description="För att ta emot betalningar via FESTEN. behöver du ansluta Stripe."
        >
          <OverviewBannerButton href="/api/stripe/connect" variant="dark">
            Anslut Stripe →
          </OverviewBannerButton>
        </OverviewBanner>
      )}

      <OverviewBanner
        variant={publishedCount > 0 ? 'success' : 'primary'}
        title={
          publishedCount > 0
            ? publishedCount === 1
              ? 'Din tjänst är publicerad'
              : `${publishedCount} tjänster publicerade`
            : hasAnyPublished
              ? 'Dina tjänster är pausade'
              : 'Du har ingen publicerad tjänst ännu'
        }
        description={
          publishedCount > 0
            ? service?.title ?? 'Dina tjänster syns för planerare'
            : hasAnyPublished
              ? 'Aktivera en pausad tjänst under Tjänster för att synas i sök'
              : service?.title ??
                (services.length > 0
                  ? 'Slutför eller publicera en tjänst för att synas'
                  : 'Skapa din första tjänst för att synas för planerare')
        }
      >
        <OverviewBannerButton href="/dashboard/listings" variant="outline">
          Visa tjänster
        </OverviewBannerButton>
        <OverviewBannerButton
          href={
            service
              ? `/dashboard/profile?service=${service.id}`
              : '/dashboard/listings/new'
          }
          variant="dark"
        >
          {publishedCount > 0 ? 'Redigera' : 'Skapa tjänst'}
        </OverviewBannerButton>
      </OverviewBanner>

      <OverviewActionGrid
        actions={[
          {
            href: '/dashboard/requests',
            title: 'Förfrågningar',
            description: 'Acceptera eller neka bokningar',
            badge: (pendingRequests ?? 0) > 0 ? `${pendingRequests} nya` : null,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            ),
          },
          {
            href: '/dashboard/today',
            title: 'Dagens schema',
            description: 'Bekräftade bokningar idag och framåt',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            ),
          },
          {
            href: '/dashboard/messages',
            title: 'Meddelanden',
            description: 'Konversationer med planerare',
            badge: (unreadMessages ?? 0) > 0 ? `${unreadMessages} nya` : null,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
          },
          {
            href: '/dashboard/listings',
            title: 'Din tjänst',
            description: 'Hantera bilder, pris och beskrivning',
            featured: true,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
          },
        ]}
      />

      {(totalRequests ?? 0) > 0 && (
        <p className="mt-6 text-[13px] text-[#6a6a6a]">
          {totalRequests} förfrågningar totalt
        </p>
      )}
    </ProviderHostShell>
  )
}
