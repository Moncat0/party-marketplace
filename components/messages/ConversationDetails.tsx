'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import PayButton from '@/components/PayButton'
import { Button } from '@/components/ui/button'
import CancelBookingModal from '@/components/bookings/CancelBookingModal'
import OfferModal from '@/components/offers/OfferModal'
import { bookingOccasionLabel } from '@/lib/booking-labels'
import { resolveBookingCancellationPolicyId } from '@/lib/booking-cancel'
import type { CancellationPolicyId } from '@/lib/cancellation-policies'
import { cancellationPolicySummary, type QuoteRecord } from '@/lib/quotes'
import { cn } from '@/lib/utils'

export type ConversationDetailsBooking = {
  id: string
  status: string
  event_date: string | null
  event_type: string | null
  occasions?: string[] | null
  event_location: string | null
  guest_count: number | null
  description: string | null
  price_ore?: number | null
  payment_status?: string | null
  cancellationPolicyId?: CancellationPolicyId | null
}

type ProviderSide = {
  role: 'provider'
  plannerName: string
  plannerAvatarUrl?: string | null
}

type PlannerSide = {
  role: 'planner'
  providerName: string
  serviceTitle: string | null
  servicePhoto: string | null
  serviceId?: string | null
  stripeOnboarded?: boolean
}

type Props = {
  booking: ConversationDetailsBooking
  inboxPath: string
  side: ProviderSide | PlannerSide
  pendingQuote?: QuoteRecord | null
  /** Content-only layout for mobile sheets (no aside chrome / close). */
  bare?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Accepterad',
  completed: 'Avslutad',
  pending: 'Väntar',
  declined: 'Avböjd',
  cancelled: 'Avbokad',
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Airbnb-style right rail — booking context beside the chat. */
export default function ConversationDetails({
  booking,
  inboxPath,
  side,
  pendingQuote = null,
  bare = false,
}: Props) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const eventLabel = bookingOccasionLabel(booking)
  const dateLabel = formatDate(booking.event_date)
  const statusLabel = STATUS_LABEL[booking.status] ?? booking.status

  const personName = side.role === 'provider' ? side.plannerName : side.providerName
  const initial = personName.charAt(0).toUpperCase()

  const needsPayment =
    side.role === 'planner' &&
    booking.status === 'accepted' &&
    booking.payment_status === 'unpaid' &&
    !!booking.price_ore &&
    !!side.stripeOnboarded

  const awaitingStripe =
    side.role === 'planner' &&
    booking.status === 'accepted' &&
    booking.payment_status === 'unpaid' &&
    !!booking.price_ore &&
    !side.stripeOnboarded

  const fundsHeld =
    booking.payment_status === 'held' || booking.payment_status === 'pending_release'

  const canCancel = booking.status === 'accepted'
  const messagesHref =
    side.role === 'provider'
      ? `/dashboard/messages?c=${booking.id}`
      : `/planner/messages?c=${booking.id}`
  const bookingListHref =
    side.role === 'provider' ? '/dashboard/requests' : '/planner/bookings'

  const cancellationPolicyId =
    booking.cancellationPolicyId ??
    resolveBookingCancellationPolicyId({
      acceptedQuotePolicy: null,
      servicePolicy: null,
    })

  const policySummary = pendingQuote
    ? cancellationPolicySummary(pendingQuote.cancellation_policy)
    : null

  function close() {
    router.push(inboxPath, { scroll: false })
  }

  async function handleWithdrawQuote() {
    if (!pendingQuote || withdrawing) return
    if (!window.confirm('Ta tillbaka offerten? Arrangören kan inte längre acceptera den.')) return
    setWithdrawing(true)
    setWithdrawError(null)
    const res = await fetch(`/api/quotes/${pendingQuote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'withdrawn' }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.refresh()
    } else {
      setWithdrawError(data.error ?? 'Kunde inte ta tillbaka offerten.')
    }
    setWithdrawing(false)
  }

  const body = (
      <div className={cn('flex-1 overflow-y-auto', bare ? 'px-0 py-0' : 'px-5 py-5')}>
        {side.role === 'planner' && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[#ebebeb]">
            {side.servicePhoto ? (
              <div className="relative aspect-[4/3] bg-[#f2f2f2]">
                <Image
                  src={side.servicePhoto}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="340px"
                />
              </div>
            ) : null}
            <div className="px-4 py-4">
              {side.serviceTitle ? (
                side.serviceId ? (
                  <Link
                    href={`/tjanster/${side.serviceId}`}
                    className="block text-[16px] font-semibold leading-snug text-[#222222] underline-offset-2 hover:underline"
                  >
                    {side.serviceTitle}
                  </Link>
                ) : (
                  <p className="text-[16px] font-semibold leading-snug text-[#222222]">
                    {side.serviceTitle}
                  </p>
                )
              ) : null}
              <div className="mt-3 flex items-center gap-2.5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[12px] font-semibold text-[#222222]">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#222222]">{personName}</p>
                  <p className="text-[12px] text-[#6a6a6a]">Talang</p>
                </div>
              </div>
              {side.serviceId ? (
                <Link
                  href={`/tjanster/${side.serviceId}`}
                  className="mt-4 inline-block text-[14px] font-medium text-[#222222] underline underline-offset-2"
                >
                  Visa tjänst
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {side.role === 'provider' && (
          <div className="mb-5 flex items-center gap-3">
            {side.plannerAvatarUrl ? (
              <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#f2f2f2]">
                <Image
                  src={side.plannerAvatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </span>
            ) : (
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,53,0.1)] text-[16px] font-semibold text-[#FF6B35]">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-[#222222]">{personName}</p>
              <p className="text-[13px] text-[#6a6a6a]">Arrangör</p>
            </div>
          </div>
        )}

        {side.role === 'provider' && pendingQuote && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[#222222] bg-white shadow-sm">
            <div className="border-b border-[#ebebeb] bg-[#222222] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Väntande offert
              </p>
              <p className="text-xl font-bold text-white">
                {Math.round(pendingQuote.price_ore / 100).toLocaleString('sv-SE')} kr
              </p>
            </div>
            <div className="space-y-3 px-4 py-4">
              {policySummary && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
                    Avbokning
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#222222]">
                    {policySummary}
                  </p>
                </div>
              )}
              {pendingQuote.duration && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
                    Längd
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#222222]">{pendingQuote.duration}</p>
                </div>
              )}
              {withdrawError && <p className="text-xs text-destructive">{withdrawError}</p>}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOfferOpen(true)}
                  className="h-auto flex-1 rounded-xl py-2 text-[13px] font-semibold"
                >
                  Redigera
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleWithdrawQuote()}
                  disabled={withdrawing}
                  className="h-auto flex-1 rounded-xl py-2 text-[13px] font-medium text-muted-foreground hover:text-destructive"
                >
                  {withdrawing ? '…' : 'Ta tillbaka'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold',
              booking.status === 'accepted' && 'bg-[rgba(29,158,117,0.12)] text-[#1D9E75]',
              booking.status === 'completed' && 'bg-[#f2f2f2] text-[#222222]',
              booking.status === 'cancelled' && 'bg-[#f2f2f2] text-[#6a6a6a]',
              booking.status !== 'accepted' &&
                booking.status !== 'completed' &&
                booking.status !== 'cancelled' &&
                'bg-[rgba(255,107,53,0.12)] text-[#FF6B35]'
            )}
          >
            {statusLabel}
          </span>
        </div>

        <dl className="space-y-4 border-t border-[#ebebeb] pt-5">
          {eventLabel && <DetailRow label="Typ av event" value={eventLabel} />}
          {dateLabel && <DetailRow label="Datum" value={dateLabel} />}
          {booking.event_location && (
            <DetailRow label="Plats" value={booking.event_location} />
          )}
          {booking.guest_count != null && (
            <DetailRow label="Gäster" value={`${booking.guest_count}`} />
          )}
          {fundsHeld && <DetailRow label="Betalning" value="Betald (hålls av FESTEN)" />}
          {booking.payment_status === 'released' && (
            <DetailRow label="Betalning" value="Utbetald" />
          )}
          {booking.payment_status === 'unpaid' && booking.price_ore != null && (
            <DetailRow
              label="Offert"
              value={`${Math.round(booking.price_ore / 100).toLocaleString('sv-SE')} kr`}
            />
          )}
        </dl>

        {booking.description && (
          <div className="mt-5 border-t border-[#ebebeb] pt-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#6a6a6a]">
              Meddelande
            </p>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#222222]">
              {booking.description}
            </p>
          </div>
        )}

        {(needsPayment || awaitingStripe) && (
          <div className="mt-6 border-t border-[#ebebeb] pt-5">
            {needsPayment && booking.price_ore != null && (
              <PayButton bookingId={booking.id} priceOre={booking.price_ore} />
            )}
            {awaitingStripe && (
              <p className="text-[13px] text-[#6a6a6a]">
                Väntar på att talangen kopplar betalning.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-[#ebebeb] pt-5">
          {!bare ? (
            <Link
              href={messagesHref}
              className="text-[14px] font-medium text-[#222222] underline underline-offset-2"
            >
              Öppna chatt
            </Link>
          ) : null}
          <Link
            href={bookingListHref}
            className="text-[14px] font-medium text-[#222222] underline underline-offset-2"
          >
            {side.role === 'provider' ? 'Visa i förfrågningar' : 'Visa bokning'}
          </Link>
        </div>

        {canCancel && (
          <div className="mt-4">
            <Button
              type="button"
              variant="dangerOutline"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="rounded-full"
            >
              Avboka bokning
            </Button>
          </div>
        )}
      </div>
  )

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col bg-white',
        bare ? 'h-auto' : 'h-full border-l border-[#ebebeb]'
      )}
    >
      {!bare && (
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#ebebeb] px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#222222]">Bokning</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Stäng bokningsdetaljer"
            onClick={close}
            className="h-8 w-8 rounded-full text-[#222222] hover:bg-[#f7f7f7]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>
      )}

      {body}

      {canCancel && (
        <CancelBookingModal
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          bookingId={booking.id}
          role={side.role}
          eventDate={booking.event_date}
          priceOre={booking.price_ore}
          paymentStatus={booking.payment_status}
          cancellationPolicyId={cancellationPolicyId}
          onSuccess={() => router.refresh()}
        />
      )}

      {side.role === 'provider' && (
        <OfferModal
          open={offerOpen}
          onOpenChange={setOfferOpen}
          bookingId={booking.id}
          eventDate={booking.event_date}
          eventLocation={booking.event_location}
          guestCount={booking.guest_count}
          existingQuote={pendingQuote}
          onSuccess={() => router.refresh()}
        />
      )}
    </aside>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#6a6a6a]">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] text-[#222222] first-letter:uppercase">{value}</dd>
    </div>
  )
}
