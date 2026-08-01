'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  CANCELLATION_POLICIES,
  getCancellationPolicy,
  type CancellationPolicyId,
} from '@/lib/cancellation-policies'
import {
  cancellationPolicyIdFromStored,
  type QuoteRecord,
} from '@/lib/quotes'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  eventDate: string | null
  eventLocation: string | null
  guestCount?: number | null
  defaultCancellationPolicy?: CancellationPolicyId | null
  existingQuote?: QuoteRecord | null
  onSuccess?: (payload: { message?: unknown; quote?: QuoteRecord }) => void
}

function formatLockedDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function OfferModal({
  open,
  onOpenChange,
  bookingId,
  eventDate,
  eventLocation,
  guestCount,
  defaultCancellationPolicy,
  existingQuote,
  onSuccess,
}: Props) {
  const isEdit = !!existingQuote

  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [cancellation, setCancellation] = useState<CancellationPolicyId>('moderate')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (existingQuote) {
      setPrice(String(Math.round(existingQuote.price_ore / 100)))
      setDescription(existingQuote.description ?? '')
      setDuration(existingQuote.duration ?? '')
      setCancellation(
        cancellationPolicyIdFromStored(existingQuote.cancellation_policy) ??
          defaultCancellationPolicy ??
          'moderate'
      )
    } else {
      setPrice('')
      setDescription('')
      setDuration('')
      setCancellation(defaultCancellationPolicy ?? 'moderate')
    }
    setError(null)
  }, [open, existingQuote, defaultCancellationPolicy])

  const selectedPolicy = getCancellationPolicy(cancellation)
  const netPayout =
    price && Number(price) > 0
      ? Math.round(Number(price) * 0.8).toLocaleString('sv-SE')
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!price || Number(price) < 1 || submitting) return
    setSubmitting(true)
    setError(null)

    const body = {
      price_sek: Number(price),
      description: description.trim() || null,
      duration: duration.trim() || null,
      cancellation_policy: cancellation,
      event_date: eventDate,
      location: eventLocation?.trim() || null,
    }

    const res = await fetch(
      isEdit ? `/api/quotes/${existingQuote!.id}` : '/api/quotes',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? body
            : { booking_request_id: bookingId, ...body }
        ),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      onSuccess?.(data)
      onOpenChange(false)
    } else if (data.code === 'stripe_required') {
      setError(data.error)
    } else {
      setError(data.error ?? (isEdit ? 'Kunde inte uppdatera offerten.' : 'Kunde inte skicka offerten.'))
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 sm:max-w-md"
        showClose={false}
      >
        <DialogHeader className="relative border-b border-[#ebebeb] px-5 py-4 text-center">
          <DialogTitle className="text-[16px] font-semibold text-[#222222]">
            {isEdit ? 'Redigera offert' : 'Skicka offert'}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
            aria-label="Stäng"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <p className="mb-4 text-[13px] leading-relaxed text-[#6a6a6a]">
            Arrangören fyllde i datum och plats i förfrågan. Du anger pris och vad som ingår.
          </p>

          <div className="mb-4 space-y-3 rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 py-3">
            <LockedField label="Datum" value={formatLockedDate(eventDate)} />
            <LockedField label="Plats" value={eventLocation?.trim() || '—'} />
            {guestCount != null && guestCount > 0 && (
              <LockedField
                label="Gäster"
                value={`${guestCount} ${guestCount === 1 ? 'gäst' : 'gäster'}`}
              />
            )}
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Pris *</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="3 000"
                  className="w-full rounded-xl border border-[#ebebeb] bg-white px-4 py-2.5 pr-10 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6a6a6a]">
                  kr
                </span>
              </div>
              {netPayout && (
                <p className="mt-1 text-xs text-[#6a6a6a]">
                  Du får:{' '}
                  <span className="font-semibold text-[#1D9E75]">{netPayout} kr</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Tid/längd</label>
              <input
                type="text"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="T.ex. 2 timmar"
                className="w-full rounded-xl border border-[#ebebeb] bg-white px-4 py-2.5 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Vad ingår</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="T.ex. 2 timmars uppträdande, eget ljud och ljus..."
              rows={3}
              className="w-full resize-none rounded-xl border border-[#ebebeb] bg-white px-4 py-2.5 text-sm text-[#222222] placeholder-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-[#6a6a6a]">Avbokningspolicy</label>
            <select
              value={cancellation}
              onChange={e => setCancellation(e.target.value as CancellationPolicyId)}
              className="w-full rounded-xl border border-[#ebebeb] bg-white px-4 py-2.5 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
            >
              {CANCELLATION_POLICIES.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.short}
                </option>
              ))}
            </select>
            {selectedPolicy && (
              <p className="mt-2 rounded-lg bg-[#f7f7f7] px-3 py-2 text-[12px] leading-relaxed text-[#6a6a6a]">
                {selectedPolicy.detail}
              </p>
            )}
          </div>

          {error && (
            <p className="mb-3 text-sm text-destructive">
              {error}{' '}
              {error.includes('Stripe') || error.includes('utbetalning') ? (
                <Link href="/dashboard/account?s=payments" className="underline">
                  Öppna betalningar →
                </Link>
              ) : null}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={!price || Number(price) < 1 || submitting}
              className="h-auto flex-1 rounded-xl py-2.5 text-sm font-semibold"
            >
              {submitting ? '…' : isEdit ? 'Spara ändringar' : 'Skicka offert'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-auto px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">{label}</p>
      <p className={cn('mt-0.5 text-sm text-[#222222] first-letter:uppercase')}>{value}</p>
    </div>
  )
}
