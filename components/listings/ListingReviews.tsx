'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export type ListingReview = {
  rating: number
  comment: string | null
  created_at: string
  users: { name: string | null; avatar_url: string | null } | null
  locationLabel?: string | null
  serviceLabel?: string | null
}

type Props = {
  reviews: ListingReview[]
  avgRating: number | null
  reviewCount: number
}

const PREVIEW = 6
const CLAMP_CHARS = 180

/** Full-width Airbnb-style reviews grid — sits below Meet provider (outside sticky column). */
export default function ListingReviews({ reviews, avgRating, reviewCount }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  if (reviewCount === 0 || !avgRating) {
    return (
      <section id="recensioner" className="border-t border-[#ebebeb] py-10 md:py-12 scroll-mt-24">
        <h2 className="text-[22px] font-semibold text-[#222222] tracking-[-0.02em]">
          Recensioner
        </h2>
        <p className="mt-3 text-[16px] text-[#6a6a6a]">
          Inga recensioner ännu — den här tjänsten är ny på plattformen.
        </p>
      </section>
    )
  }

  const preview = reviews.slice(0, PREVIEW)
  const showStars = reviewCount >= 5

  return (
    <section id="recensioner" className="border-t border-[#ebebeb] py-10 md:py-12 scroll-mt-24">
      <h2 className="text-[22px] font-semibold text-[#222222] tracking-[-0.02em] mb-6">
        {showStars ? (
          <>
            <span aria-hidden>★★★★★</span> {avgRating.toFixed(1)} · {reviewCount}{' '}
            {reviewCount === 1 ? 'recension' : 'recensioner'}
          </>
        ) : (
          <>
            {avgRating.toFixed(1)} · {reviewCount}{' '}
            {reviewCount === 1 ? 'recension' : 'recensioner'}
          </>
        )}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
        {preview.map((review, i) => (
          <ReviewCard
            key={i}
            review={review}
            expanded={!!expanded[i]}
            onToggle={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
          />
        ))}
      </div>

      {reviewCount > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAll(true)}
          className="mt-8 rounded-lg border-[#222222] bg-white px-6 h-12 text-[16px] font-semibold text-[#222222] hover:bg-[#f7f7f7]"
        >
          Visa alla {reviewCount} {reviewCount === 1 ? 'recension' : 'recensioner'}
        </Button>
      )}

      {showAll && (
        <ReviewsModal
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviewCount}
          showStars={showStars}
          onClose={() => setShowAll(false)}
        />
      )}
    </section>
  )
}

function ReviewCard({
  review,
  expanded,
  onToggle,
}: {
  review: ListingReview
  expanded: boolean
  onToggle: () => void
}) {
  const comment = review.comment ?? ''
  const needsClamp = comment.length > CLAMP_CHARS
  const display =
    !needsClamp || expanded ? comment : `${comment.slice(0, CLAMP_CHARS).trimEnd()}…`

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {review.users?.avatar_url ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
            <Image
              src={review.users.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f2f2] text-sm font-semibold text-[#222222] flex-shrink-0">
            {(review.users?.name ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-[16px] font-semibold text-[#222222] leading-tight">
            {review.users?.name ?? 'Anonym'}
          </p>
          <p className="text-[14px] text-[#6a6a6a]">
            {review.locationLabel ?? 'Medlem på Gigtorget'}
          </p>
        </div>
      </div>

      <p className="text-[14px] text-[#222222] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="font-semibold tracking-tight" aria-label={`${review.rating} av 5`}>
          {'★'.repeat(Math.round(review.rating))}
        </span>
        <span className="text-[#6a6a6a]">·</span>
        <span className="text-[#6a6a6a]">
          {new Date(review.created_at).toLocaleDateString('sv-SE', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        {review.serviceLabel && (
          <>
            <span className="text-[#6a6a6a]">·</span>
            <span className="text-[#6a6a6a]">{review.serviceLabel}</span>
          </>
        )}
      </p>

      {comment && (
        <div>
          <p className="text-[16px] text-[#222222] leading-[1.45]">{display}</p>
          {needsClamp && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-1 text-[16px] font-semibold text-[#222222] underline underline-offset-2"
            >
              {expanded ? 'Visa mindre' : 'Visa mer'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ReviewsModal({
  reviews,
  avgRating,
  reviewCount,
  showStars,
  onClose,
}: {
  reviews: ListingReview[]
  avgRating: number
  reviewCount: number
  showStars: boolean
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Alla recensioner"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-[#ebebeb] px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Stäng"
            className="rounded-full"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Button>
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {showStars ? '★★★★★ ' : ''}
            {avgRating.toFixed(1)} · {reviewCount}{' '}
            {reviewCount === 1 ? 'recension' : 'recensioner'}
          </h3>
        </div>

        <div className="flex flex-col gap-8 p-5 sm:p-8">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} expanded onToggle={() => {}} />
          ))}
        </div>
      </div>
    </div>
  )
}
