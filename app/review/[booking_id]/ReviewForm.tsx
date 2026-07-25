'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
      <main className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">
          <p className="text-4xl mb-4">🎉</p>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Tack för ditt omdöme!</h1>
          <p className="text-sm text-[#5F5E5A] mb-8">Det hjälper andra att hitta rätt talang.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
          >
            Tillbaka till dashboarden
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFF8F3] px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">Lämna ett omdöme</h1>
          <p className="text-sm text-[#5F5E5A]">Hur var din upplevelse med {revieweeName}?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-medium text-[#1A1A2E] mb-4">Betyg</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-4xl transition-transform hover:scale-110"
                >
                  <span className={(hovered || rating) >= star ? 'text-[#FF6B35]' : 'text-[#E8E3DC]'}>★</span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-[#5F5E5A] mt-3">
                {rating === 1 ? 'Dålig' : rating === 2 ? 'Okej' : rating === 3 ? 'Bra' : rating === 4 ? 'Mycket bra' : 'Fantastisk!'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-medium text-[#1A1A2E] block mb-2">
              Kommentar <span className="text-[#5F5E5A] font-normal">(valfritt)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={`Berätta om din upplevelse med ${revieweeName}...`}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-[#E8E3DC] bg-[#FFF8F3] px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
            />
            <p className="text-xs text-[#5F5E5A] mt-1 text-right">{comment.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={!rating || submitting}
            className="w-full rounded-xl bg-[#FF6B35] py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40"
          >
            {submitting ? 'Skickar...' : 'Skicka omdöme'}
          </button>
        </form>
      </div>
    </main>
  )
}
