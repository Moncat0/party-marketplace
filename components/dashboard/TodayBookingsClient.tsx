'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { settingsTokens as t } from '@/components/settings/tokens'
import { formatEventType } from '@/lib/event-types'

export type HostBooking = {
  id: string
  event_date: string | null
  event_type: string | null
  event_location: string | null
  guest_count: number | null
  planner_name: string | null
}

type Props = {
  view: 'today' | 'upcoming'
  today: HostBooking[]
  upcoming: HostBooking[]
  hasPublishedListing: boolean
}

export default function TodayBookingsClient({
  view,
  today,
  upcoming,
  hasPublishedListing,
}: Props) {
  const router = useRouter()
  const list = view === 'today' ? today : upcoming

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 flex justify-center">
        <div
          className="inline-flex rounded-full p-1"
          style={{ background: t.colors.surfaceStrong }}
          role="tablist"
          aria-label="Bokningsperiod"
        >
          <Tab
            active={view === 'today'}
            onClick={() => router.push('/dashboard/today')}
            label="Idag"
          />
          <Tab
            active={view === 'upcoming'}
            onClick={() => router.push('/dashboard/today?view=upcoming')}
            label="Kommande"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <EmptyIllustration />
          <h1
            className="mt-8 text-[26px] font-semibold leading-tight tracking-[-0.4px]"
            style={{ color: t.colors.ink }}
          >
            {view === 'today'
              ? 'Inga bekräftade bokningar idag'
              : 'Inga kommande bokningar'}
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed" style={{ color: t.colors.muted }}>
            {hasPublishedListing
              ? 'När planerare bokar dig och du accepterar visas evenemangen här.'
              : 'För att bli bokad behöver du slutföra och publicera din tjänst.'}
          </p>
          {!hasPublishedListing && (
            <Button
              asChild
              variant="secondary"
              className="mt-6 h-auto rounded-xl px-5 py-3 text-[15px] font-semibold"
            >
              <Link href="/dashboard/profile">Slutför din tjänst</Link>
            </Button>
          )}
          {hasPublishedListing && (
            <Button
              asChild
              variant="secondary"
              className="mt-6 h-auto rounded-xl px-5 py-3 text-[15px] font-semibold"
            >
              <Link href="/dashboard/requests">Se förfrågningar</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map(b => (
            <li key={b.id}>
              <Link
                href={`/dashboard/messages?c=${b.id}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-[#ebebeb] bg-white p-5 transition hover:bg-[#f7f7f7]"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#222222]">
                    {b.planner_name ?? 'Arrangör'}
                    {b.event_type
                      ? ` · ${formatEventType(b.event_type) ?? b.event_type}`
                      : ''}
                  </p>
                  <p className="mt-1 text-[14px] text-[#6a6a6a]">
                    {[
                      b.event_date
                        ? new Date(b.event_date).toLocaleDateString('sv-SE', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })
                        : null,
                      b.event_location,
                      b.guest_count != null ? `${b.guest_count} gäster` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[14px] font-medium text-[#222222] underline underline-offset-2">
                  Meddelanden
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Tab({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors',
        active ? 'bg-[#222222] text-white' : 'text-[#222222] hover:bg-white/60'
      )}
    >
      {label}
    </button>
  )
}

function EmptyIllustration() {
  return (
    <div
      className="flex h-40 w-40 items-center justify-center rounded-3xl"
      style={{ background: t.colors.surfaceSoft }}
      aria-hidden
    >
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="14" y="18" width="44" height="40" rx="6" fill="#fff" stroke="#dddddd" strokeWidth="2" />
        <path d="M14 28h44" stroke="#dddddd" strokeWidth="2" />
        <path d="M36 18v-6" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" />
        <circle cx="36" cy="10" r="3" fill="#FF6B35" />
        <path d="M24 40h16M24 48h10" stroke="#c1c1c1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
