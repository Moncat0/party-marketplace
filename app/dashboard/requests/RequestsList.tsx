'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import SettingsInput from '@/components/settings/SettingsInput'
import { settingsTokens as t } from '@/components/settings/tokens'
import { bookingOccasionLabel } from '@/lib/booking-labels'
import OfferModal from '@/components/offers/OfferModal'
import CancelBookingModal from '@/components/bookings/CancelBookingModal'
import { resolveBookingCancellationPolicyId } from '@/lib/booking-cancel'
import { type QuoteRecord } from '@/lib/quotes'
import type { CancellationPolicyId } from '@/lib/cancellation-policies'
import { cn } from '@/lib/utils'

export type ProviderRequest = {
  id: string
  status: string
  event_date: string | null
  event_type: string | null
  occasions?: string[] | null
  event_location: string | null
  guest_count: number | null
  description: string | null
  created_at: string
  price_ore: number | null
  payment_status: string | null
  unread: number
  hasOffer: boolean
  pendingQuote: QuoteRecord | null
  acceptedQuotePolicy: string | null
  defaultCancellationPolicy: CancellationPolicyId | null
  users: { id: string; name: string | null; email: string } | null
  services: { title: string | null } | null
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Väntar', color: t.colors.primary, bg: 'rgba(255, 107, 53, 0.1)' },
  accepted: { label: 'Accepterad', color: t.colors.success, bg: 'rgba(29, 158, 117, 0.1)' },
  declined: { label: 'Avböjd', color: t.colors.muted, bg: t.colors.surfaceStrong },
  cancelled: { label: 'Avbokad', color: t.colors.muted, bg: t.colors.surfaceStrong },
  completed: { label: 'Avslutad', color: t.colors.ink, bg: 'rgba(34, 34, 34, 0.08)' },
}

function messagingAllowed(status: string): boolean {
  return status === 'accepted' || status === 'completed'
}

function canSendOffer(status: string): boolean {
  return status === 'accepted'
}

function canCancel(status: string): boolean {
  return status === 'accepted'
}

export default function RequestsList({ requests }: { requests: ProviderRequest[] }) {
  const router = useRouter()
  const [list, setList] = useState(requests)
  const [loading, setLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [hasOfferOnly, setHasOfferOnly] = useState(false)
  const [offerTarget, setOfferTarget] = useState<ProviderRequest | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ProviderRequest | null>(null)

  const counts = useMemo(() => {
    const c = { pending: 0, accepted: 0, other: 0 }
    for (const r of list) {
      if (r.status === 'pending') c.pending++
      else if (r.status === 'accepted') c.accepted++
      else c.other++
    }
    return c
  }, [list])

  const filtered = useMemo(() => {
    let rows = list
    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r => (r.users?.name ?? '').toLowerCase().includes(q))
    }
    if (dateFrom) {
      rows = rows.filter(r => r.event_date && r.event_date >= dateFrom)
    }
    if (dateTo) {
      rows = rows.filter(r => r.event_date && r.event_date <= dateTo)
    }
    if (unreadOnly) {
      rows = rows.filter(r => r.unread > 0)
    }
    if (hasOfferOnly) {
      rows = rows.filter(r => r.hasOffer)
    }
    return rows
  }, [list, statusFilter, search, dateFrom, dateTo, unreadOnly, hasOfferOnly])

  async function updateStatus(id: string, status: 'accepted' | 'declined') {
    setLoading(id)
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setList(prev => prev.map(r => (r.id === id ? { ...r, status } : r)))
      router.refresh()
    }
    setLoading(null)
  }

  function policyForRequest(req: ProviderRequest): CancellationPolicyId {
    return resolveBookingCancellationPolicyId({
      acceptedQuotePolicy: req.acceptedQuotePolicy,
    })
  }

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Alla' },
    { id: 'pending', label: 'Väntar' },
    { id: 'accepted', label: 'Accepterade' },
    { id: 'declined', label: 'Avböjda' },
    { id: 'cancelled', label: 'Avbokade' },
    { id: 'completed', label: 'Avslutade' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[32px] font-semibold leading-tight tracking-[-0.6px]"
            style={{ color: t.colors.ink }}
          >
            Förfrågningar
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: t.colors.muted }}>
            {counts.pending > 0
              ? `${counts.pending} väntar på svar`
              : 'Inga väntande förfrågningar'}
            {counts.accepted > 0 && ` · ${counts.accepted} accepterade`}
          </p>
        </div>
        <Link href="/dashboard/messages">
          <Button variant="outline" className="rounded-full border-[#dddddd]">
            Öppna chatt
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1 sm:max-w-xs">
          <SettingsInput
            id="request-search"
            label="Sök arrangör"
            value={search}
            onChange={setSearch}
            placeholder="Namn…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-[12px] font-medium text-[#6a6a6a]">
            Från
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="mt-1 block rounded-xl border border-[#ebebeb] px-3 py-2 text-sm text-[#222222]"
            />
          </label>
          <label className="text-[12px] font-medium text-[#6a6a6a]">
            Till
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="mt-1 block rounded-xl border border-[#ebebeb] px-3 py-2 text-sm text-[#222222]"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={unreadOnly} onClick={() => setUnreadOnly(v => !v)} label="Olästa" />
          <FilterChip
            active={hasOfferOnly}
            onClick={() => setHasOfferOnly(v => !v)}
            label="Har offert"
          />
        </div>
      </div>

      <div
        className="mb-6 flex gap-4 overflow-x-auto"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        {statusTabs.map(tab => {
          const active = statusFilter === tab.id
          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter(tab.id)}
              className="relative h-auto rounded-none px-0 pb-3 text-[14px] font-medium whitespace-nowrap hover:bg-transparent"
              style={{ color: active ? t.colors.ink : t.colors.muted }}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </Button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dddddd] p-10 text-center">
          <p className="text-[16px] font-semibold text-[#222222]">Inga förfrågningar matchar</p>
          <p className="mt-2 text-[14px] text-[#6a6a6a]">
            Prova att ändra filter eller vänta på nya förfrågningar.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                loading={loading}
                onUpdate={updateStatus}
                onOffer={() => setOfferTarget(req)}
                onCancel={() => setCancelTarget(req)}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[12px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
                  <th className="pb-3 pr-4 font-semibold">Arrangör</th>
                  <th className="pb-3 pr-4 font-semibold">Event</th>
                  <th className="pb-3 pr-4 font-semibold">Datum</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    loading={loading}
                    onUpdate={updateStatus}
                    onOffer={() => setOfferTarget(req)}
                    onCancel={() => setCancelTarget(req)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {offerTarget && (
        <OfferModal
          open={!!offerTarget}
          onOpenChange={open => {
            if (!open) setOfferTarget(null)
          }}
          bookingId={offerTarget.id}
          eventDate={offerTarget.event_date}
          eventLocation={offerTarget.event_location}
          guestCount={offerTarget.guest_count}
          defaultCancellationPolicy={offerTarget.defaultCancellationPolicy}
          existingQuote={offerTarget.pendingQuote}
          onSuccess={() => {
            setList(prev =>
              prev.map(r =>
                r.id === offerTarget.id ? { ...r, hasOffer: true } : r
              )
            )
            router.refresh()
          }}
        />
      )}

      {cancelTarget && (
        <CancelBookingModal
          open={!!cancelTarget}
          onOpenChange={open => {
            if (!open) setCancelTarget(null)
          }}
          bookingId={cancelTarget.id}
          role="provider"
          eventDate={cancelTarget.event_date}
          priceOre={cancelTarget.price_ore}
          paymentStatus={cancelTarget.payment_status}
          cancellationPolicyId={policyForRequest(cancelTarget)}
          onSuccess={() => {
            setList(prev =>
              prev.map(r =>
                r.id === cancelTarget.id ? { ...r, status: 'cancelled' } : r
              )
            )
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <Button
      type="button"
      variant={active ? 'dark' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'rounded-full',
        !active && 'border-[#dddddd]'
      )}
    >
      {label}
    </Button>
  )
}

function RequestActions({
  req,
  loading,
  onUpdate,
  onOffer,
  onCancel,
}: {
  req: ProviderRequest
  loading: string | null
  onUpdate: (id: string, status: 'accepted' | 'declined') => void
  onOffer: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {req.status === 'pending' && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading === req.id}
            onClick={() => onUpdate(req.id, 'declined')}
            className="min-h-10 rounded-full border-[#dddddd]"
          >
            Avböj
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading === req.id}
            onClick={() => onUpdate(req.id, 'accepted')}
            className="min-h-10 rounded-full"
          >
            {loading === req.id ? '…' : 'Acceptera'}
          </Button>
        </>
      )}
      {canSendOffer(req.status) && (
        <Button
          type="button"
          variant="dark"
          size="sm"
          onClick={onOffer}
          className="min-h-10 rounded-full"
        >
          Skicka offert
        </Button>
      )}
      {messagingAllowed(req.status) && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="min-h-10 rounded-full border-[#dddddd]"
        >
          <Link href={`/dashboard/messages?c=${req.id}`}>Chatt</Link>
        </Button>
      )}
      {canCancel(req.status) && (
        <Button
          type="button"
          variant="dangerOutline"
          size="sm"
          onClick={onCancel}
          className="min-h-10 rounded-full"
        >
          Avboka
        </Button>
      )}
    </div>
  )
}

function RequestCard({
  req,
  loading,
  onUpdate,
  onOffer,
  onCancel,
}: {
  req: ProviderRequest
  loading: string | null
  onUpdate: (id: string, status: 'accepted' | 'declined') => void
  onOffer: () => void
  onCancel: () => void
}) {
  const plannerName = req.users?.name ?? 'Okänd'
  const badge = STATUS_META[req.status] ?? STATUS_META.pending
  const initial = plannerName.charAt(0).toUpperCase()
  const occasion = bookingOccasionLabel(req)
  const dateLabel = req.event_date
    ? new Date(req.event_date).toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <article className="rounded-2xl border border-[#ebebeb] bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(34,34,34,0.08)] text-sm font-bold text-[#222222]">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[#222222]">{plannerName}</p>
              <p className="mt-0.5 text-[13px] text-[#6a6a6a]">
                {[occasion, dateLabel].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <span
              className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          {req.event_location ? (
            <p className="mt-1 truncate text-[13px] text-[#6a6a6a]">{req.event_location}</p>
          ) : null}
          {req.guest_count != null ? (
            <p className="text-[13px] text-[#6a6a6a]">{req.guest_count} gäster</p>
          ) : null}
          {req.unread > 0 ? (
            <p className="mt-1 text-[12px] font-medium text-[#FF6B35]">{req.unread} olästa</p>
          ) : null}
          {req.hasOffer && req.status === 'accepted' ? (
            <p className="mt-1 text-[12px] text-[#6a6a6a]">Offert skickad</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <RequestActions
          req={req}
          loading={loading}
          onUpdate={onUpdate}
          onOffer={onOffer}
          onCancel={onCancel}
        />
      </div>
    </article>
  )
}

function RequestRow({
  req,
  loading,
  onUpdate,
  onOffer,
  onCancel,
}: {
  req: ProviderRequest
  loading: string | null
  onUpdate: (id: string, status: 'accepted' | 'declined') => void
  onOffer: () => void
  onCancel: () => void
}) {
  const plannerName = req.users?.name ?? 'Okänd'
  const badge = STATUS_META[req.status] ?? STATUS_META.pending
  const initial = plannerName.charAt(0).toUpperCase()
  const occasion = bookingOccasionLabel(req)

  return (
    <tr className="border-b border-[#ebebeb] align-top">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(34,34,34,0.08)] text-xs font-bold text-[#222222]">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#222222]">{plannerName}</p>
            {req.unread > 0 && (
              <p className="text-[12px] font-medium text-[#FF6B35]">{req.unread} olästa</p>
            )}
            {req.hasOffer && req.status === 'accepted' && (
              <p className="text-[12px] text-[#6a6a6a]">Offert skickad</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <p className="text-[14px] text-[#222222]">{occasion ?? '—'}</p>
        {req.event_location && (
          <p className="mt-0.5 max-w-[200px] truncate text-[12px] text-[#6a6a6a]">
            {req.event_location}
          </p>
        )}
        {req.guest_count != null && (
          <p className="text-[12px] text-[#6a6a6a]">{req.guest_count} gäster</p>
        )}
      </td>
      <td className="py-4 pr-4 text-[14px] text-[#222222]">
        {req.event_date
          ? new Date(req.event_date).toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '—'}
      </td>
      <td className="py-4 pr-4">
        <span
          className="inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </td>
      <td className="py-4">
        <RequestActions
          req={req}
          loading={loading}
          onUpdate={onUpdate}
          onOffer={onOffer}
          onCancel={onCancel}
        />
      </td>
    </tr>
  )
}
