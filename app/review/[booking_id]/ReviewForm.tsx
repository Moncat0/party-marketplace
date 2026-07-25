'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

type Props = {
  bookingId: string
  revieweeId: string
  revieweeName: string
  alreadyReviewed: boolean
}

export default function ReviewForm({ bookingId, revieweeId, revieweeName, alreadyReviewed }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(alreadyReviewed)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_request_id: bookingId, reviewee_id: revieweeId, rating, comment }),
    })
    if (res.ok) {
      setDone(true)
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <SettingsSection title="Tack för ditt omdöme!">
            <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-6">
              Det hjälper andra att hitta rätt talang.
            </p>
            <SettingsButton className="w-full" onClick={() => router.push('/dashboard')}>
              Tillbaka till dashboarden
            </SettingsButton>
          </SettingsSection>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <header>
          <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-[#222222]">
            Lämna ett omdöme
          </h1>
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mt-2">
            Hur var din upplevelse med {revieweeName}?
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SettingsSection title="Betyg">
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-4xl transition-transform hover:scale-110"
                  style={{ transitionDuration: t.motion.fast }}
                  aria-label={`${star} stjärnor`}
                >
                  <span
                    style={{
                      color: (hovered || rating) >= star ? t.colors.primary : t.colors.hairline,
                    }}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-[14px] text-[#6a6a6a] mt-3">
                {rating === 1
                  ? 'Dålig'
                  : rating === 2
                    ? 'Okej'
                    : rating === 3
                      ? 'Bra'
                      : rating === 4
                        ? 'Mycket bra'
                        : 'Fantastisk!'}
              </p>
            )}
          </SettingsSection>

          <SettingsSection title="Kommentar (valfritt)">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={`Berätta om din upplevelse med ${revieweeName}...`}
              rows={4}
              maxLength={500}
              className="w-full bg-white text-[#222222] text-[16px] leading-[1.5] placeholder:text-[#929292] focus:outline-none resize-none"
              style={{
                minHeight: 120,
                padding: '14px 12px',
                borderRadius: t.rounded.sm,
                border: `1px solid ${t.colors.hairline}`,
              }}
              onFocus={e => {
                e.currentTarget.style.border = `2px solid ${t.colors.ink}`
                e.currentTarget.style.padding = '13px 11px'
              }}
              onBlur={e => {
                e.currentTarget.style.border = `1px solid ${t.colors.hairline}`
                e.currentTarget.style.padding = '14px 12px'
              }}
            />
            <p className="text-[13px] text-[#929292] mt-1.5 text-right">{comment.length}/500</p>
          </SettingsSection>

          <SettingsButton
            type="submit"
            className="w-full"
            disabled={!rating || submitting}
          >
            {submitting ? 'Skickar...' : 'Skicka omdöme'}
          </SettingsButton>
        </form>
      </div>
    </main>
  )
}
