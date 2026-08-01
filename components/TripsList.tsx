'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PayButton from '@/components/PayButton'
import { Button } from '@/components/ui/button'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'
import { bookingOccasionLabel } from '@/lib/booking-labels'

export type TripBooking = {
  id: string
  status: string
  event_date: string | null
  event_type: string | null
  occasions?: string[] | null
  price_ore: number | null
  payment_status: string | null
  services: {
    id: string
    title: string | null
    photos: string[] | null
    stripe_onboarded: boolean
    users: { name: string | null } | null
  } | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Väntar på svar',
  accepted: 'Bekräftad',
  declined: 'Avböjd',
  completed: 'Avslutad',
}

type Tab = 'upcoming' | 'past' | 'declined'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function classify(booking: TripBooking, today: Date): Tab {
  if (booking.status === 'declined') return 'declined'
  if (booking.event_date && new Date(booking.event_date) < today) return 'past'
  if (booking.status === 'completed') return 'past'
  return 'upcoming'
}

function statusStyle(status: string): { bg: string; color: string } {
  if (status === 'accepted') return { bg: 'rgba(29, 158, 117, 0.1)', color: t.colors.success }
  if (status === 'declined') return { bg: t.colors.surfaceStrong, color: t.colors.muted }
  if (status === 'completed') return { bg: 'rgba(34, 34, 34, 0.08)', color: t.colors.ink }
  return { bg: 'rgba(255, 107, 53, 0.1)', color: t.colors.primary }
}

export default function TripsList({ bookings }: { bookings: TripBooking[] }) {
  const today = useMemo(() => startOfToday(), [])
  const [tab, setTab] = useState<Tab>('upcoming')

  const counts = useMemo(() => {
    const c = { upcoming: 0, past: 0, declined: 0 }
    for (const b of bookings) c[classify(b, today)]++
    return c
  }, [bookings, today])

  const filtered = bookings.filter(b => classify(b, today) === tab)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Kommande' },
    { id: 'past', label: 'Tidigare' },
    { id: 'declined', label: 'Avböjda' },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-[1.125] tracking-[-0.8px] text-[#222222]">
            Mina bokningar
          </h1>
          <p className="text-[14px] text-[#6a6a6a] mt-2">{bookings.length} totalt</p>
        </div>
        <Link href="/">
          <SettingsButton size="sm">+ Boka ny talang</SettingsButton>
        </Link>
      </div>

      <div
        className="flex gap-6 mb-8 overflow-x-auto"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        {tabs.map(item => {
          const active = tab === item.id
          return (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              onClick={() => setTab(item.id)}
              className="relative h-auto rounded-none px-0 pb-3 text-[14px] font-medium whitespace-nowrap hover:bg-transparent"
              style={{ color: active ? t.colors.ink : t.colors.muted }}
            >
              {item.label}
              {counts[item.id] > 0 && (
                <span className="ml-1.5 text-muted-foreground">({counts[item.id]})</span>
              )}
              {active && (
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-foreground" />
              )}
            </Button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[16px] font-medium text-[#222222] mb-2">
            {tab === 'upcoming'
              ? 'Inga kommande bokningar'
              : tab === 'past'
                ? 'Inga tidigare bokningar'
                : 'Inga avböjda förfrågningar'}
          </p>
          <p className="text-[14px] text-[#6a6a6a] mb-6">
            {tab === 'upcoming'
              ? 'När du skickar en förfrågan dyker den upp här.'
              : 'Här samlas bokningar i den här kategorin.'}
          </p>
          {tab === 'upcoming' && (
            <Link href="/">
              <SettingsButton>Hitta underhållning →</SettingsButton>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(booking => (
            <TripCard key={booking.id} booking={booking} today={today} />
          ))}
        </div>
      )}
    </div>
  )
}

function TripCard({ booking, today }: { booking: TripBooking; today: Date }) {
  const profile = booking.services
  const providerName = profile?.users?.name ?? profile?.title ?? 'Okänd'
  const photo = profile?.photos?.[0]
  const eventPast = booking.event_date ? new Date(booking.event_date) < today : false
  const canReview =
    (booking.status === 'accepted' || booking.status === 'completed') && eventPast
  const canChat = booking.status === 'accepted' || booking.status === 'completed'
  const needsPayment =
    booking.status === 'accepted' &&
    booking.payment_status === 'unpaid' &&
    booking.price_ore &&
    profile?.stripe_onboarded
  const awaitingStripe =
    booking.status === 'accepted' &&
    booking.payment_status === 'unpaid' &&
    booking.price_ore &&
    !profile?.stripe_onboarded
  const fundsHeld =
    booking.payment_status === 'held' || booking.payment_status === 'pending_release'
  const badge = statusStyle(booking.status)

  return (
    <article
      className="overflow-hidden bg-white"
      style={{
        borderRadius: t.rounded.md,
        border: `1px solid ${t.colors.hairline}`,
      }}
    >
      <div className="relative aspect-[16/10] bg-[#f2f2f2]">
        {photo ? (
          <Image src={photo} alt="" fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🎉</div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-[#222222] truncate">
              {profile?.title ?? 'Tjänst'}
            </p>
            <p className="text-[14px] text-[#6a6a6a] truncate">{providerName}</p>
          </div>
          <span
            className="flex-shrink-0 px-2.5 py-0.5 text-[12px] font-medium"
            style={{
              borderRadius: t.rounded.full,
              backgroundColor: badge.bg,
              color: badge.color,
            }}
          >
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[#6a6a6a]">
          {booking.event_date && (
            <span>
              {new Date(booking.event_date).toLocaleDateString('sv-SE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
          {bookingOccasionLabel(booking) && (
            <span>{bookingOccasionLabel(booking)}</span>
          )}
          {fundsHeld && (
            <span style={{ color: t.colors.success }}>Betald (hålls) ✓</span>
          )}
          {booking.payment_status === 'released' && (
            <span style={{ color: t.colors.success }}>Utbetald ✓</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {needsPayment && booking.price_ore && (
            <PayButton bookingId={booking.id} priceOre={booking.price_ore} />
          )}
          {awaitingStripe && (
            <span className="text-[12px] text-[#6a6a6a]">Väntar på betalningskoppling</span>
          )}
          {canReview && (
            <Link href={`/review/${booking.id}`}>
              <SettingsButton size="sm">Omdöme</SettingsButton>
            </Link>
          )}
          {canChat && (
            <Link href={`/planner/messages?c=${booking.id}`}>
              <SettingsButton size="sm" variant="secondary">
                Chatt →
              </SettingsButton>
            </Link>
          )}
          {booking.status === 'pending' && (
            <span className="text-[12px] text-[#6a6a6a]">Väntar på svar...</span>
          )}
          {booking.status === 'declined' && (
            <Link href="/">
              <SettingsButton size="sm" variant="secondary">
                Hitta annan →
              </SettingsButton>
            </Link>
          )}
          {profile?.id && (
            <Link
              href={`/tjanster/${profile.id}`}
              className="text-[13px] font-medium text-[#222222] underline underline-offset-2 ml-auto"
            >
              Visa profil
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
