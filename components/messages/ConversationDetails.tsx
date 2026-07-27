'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PayButton from '@/components/PayButton'
import { Button } from '@/components/ui/button'
import { bookingOccasionLabel } from '@/lib/booking-labels'
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
}

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Accepterad',
  completed: 'Avslutad',
  pending: 'Väntar',
  declined: 'Avböjd',
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
export default function ConversationDetails({ booking, inboxPath, side }: Props) {
  const router = useRouter()
  const eventLabel = bookingOccasionLabel(booking)
  const dateLabel = formatDate(booking.event_date)
  const statusLabel = STATUS_LABEL[booking.status] ?? booking.status

  const personName = side.role === 'provider' ? side.plannerName : side.providerName
  const initial = personName.charAt(0).toUpperCase()

  const needsPayment =
    side.role === 'planner' &&
    booking.status === 'accepted' &&
    booking.payment_status !== 'paid' &&
    !!booking.price_ore &&
    !!side.stripeOnboarded

  const awaitingStripe =
    side.role === 'planner' &&
    booking.status === 'accepted' &&
    booking.payment_status !== 'paid' &&
    !!booking.price_ore &&
    !side.stripeOnboarded

  function close() {
    router.push(inboxPath, { scroll: false })
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-[#ebebeb] bg-white">
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

      <div className="flex-1 overflow-y-auto px-5 py-5">
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

        <div className="mb-5">
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold',
              booking.status === 'accepted' && 'bg-[rgba(29,158,117,0.12)] text-[#1D9E75]',
              booking.status === 'completed' && 'bg-[#f2f2f2] text-[#222222]',
              booking.status !== 'accepted' &&
                booking.status !== 'completed' &&
                'bg-[rgba(255,107,53,0.12)] text-[#FF6B35]'
            )}
          >
            {statusLabel}
          </span>
        </div>

        <dl className="space-y-4 border-t border-[#ebebeb] pt-5">
          {eventLabel && (
            <DetailRow label="Typ av event" value={eventLabel} />
          )}
          {dateLabel && <DetailRow label="Datum" value={dateLabel} />}
          {booking.event_location && (
            <DetailRow label="Plats" value={booking.event_location} />
          )}
          {booking.guest_count != null && (
            <DetailRow label="Gäster" value={`${booking.guest_count}`} />
          )}
          {booking.payment_status === 'paid' && (
            <DetailRow label="Betalning" value="Betald" />
          )}
          {booking.price_ore != null && booking.payment_status !== 'paid' && (
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

        {side.role === 'provider' && (
          <div className="mt-6 border-t border-[#ebebeb] pt-5">
            <Link
              href="/dashboard/requests"
              className="text-[14px] font-medium text-[#222222] underline underline-offset-2"
            >
              Alla förfrågningar
            </Link>
          </div>
        )}
      </div>
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
