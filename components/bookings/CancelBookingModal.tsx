'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  cancelPolicyDetail,
  expectedRefundOre,
  type CancelRole,
} from '@/lib/booking-cancel'
import { isFundsHeld } from '@/lib/payment-status'
import type { CancellationPolicyId } from '@/lib/cancellation-policies'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  role: CancelRole
  eventDate: string | null
  priceOre: number | null | undefined
  paymentStatus: string | null | undefined
  cancellationPolicyId: CancellationPolicyId
  onSuccess?: () => void
}

function formatSek(ore: number): string {
  return Math.round(ore / 100).toLocaleString('sv-SE')
}

export default function CancelBookingModal({
  open,
  onOpenChange,
  bookingId,
  role,
  eventDate,
  priceOre,
  paymentStatus,
  cancellationPolicyId,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refundOre = useMemo(
    () =>
      expectedRefundOre({
        role,
        priceOre,
        paymentStatus,
        eventDate,
        policyId: cancellationPolicyId,
      }),
    [role, priceOre, paymentStatus, eventDate, cancellationPolicyId]
  )

  const paidHeld = isFundsHeld(paymentStatus) && (priceOre ?? 0) > 0
  const policyDetail = cancelPolicyDetail(cancellationPolicyId)

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() || undefined }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Kunde inte avboka.')
      setSubmitting(false)
      return
    }

    onOpenChange(false)
    setReason('')
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold text-[#222222]">
            Avboka bokningen?
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-left text-[14px] leading-relaxed text-[#6a6a6a]">
              {role === 'planner' ? (
                <>
                  {paidHeld ? (
                    <>
                      <p>
                        Enligt avbokningspolicyn för denna bokning gäller följande vid avbokning
                        nu:
                      </p>
                      <p className="rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-3 py-2.5 text-[13px] text-[#222222]">
                        {policyDetail}
                      </p>
                      <p>
                        Beräknad återbetalning:{' '}
                        <strong className="text-[#222222]">
                          {refundOre > 0 ? `${formatSek(refundOre)} kr` : 'Ingen återbetalning'}
                        </strong>
                        {priceOre ? ` av ${formatSek(priceOre)} kr` : null}
                      </p>
                    </>
                  ) : (
                    <p>
                      Bokningen avbokas. Ingen betalning har genomförts, så ingen återbetalning
                      behövs.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>
                    Avbokning påverkar din tillförlitlighet på Festly och kan synas för
                    arrangörer som planerar framtida evenemang.
                  </p>
                  {paidHeld && (
                    <p>
                      Arrangören får full återbetalning ({formatSek(priceOre ?? 0)} kr) eftersom
                      avbokningen sker från talangens sida.
                    </p>
                  )}
                  {!paidHeld && (
                    <p>Arrangören meddelas om avbokningen i chatten.</p>
                  )}
                </>
              )}

              <div>
                <label
                  htmlFor="cancel-reason"
                  className="mb-1 block text-[12px] font-medium text-[#6a6a6a]"
                >
                  Meddelande (valfritt)
                </label>
                <textarea
                  id="cancel-reason"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  placeholder="Berätta kort varför…"
                  className="w-full resize-none rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-sm text-[#222222] placeholder:text-[#a0a0a0] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-xl"
          >
            Behåll bokning
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={submitting}
            className="rounded-xl"
          >
            {submitting ? 'Avbokar…' : 'Bekräfta avbokning'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
