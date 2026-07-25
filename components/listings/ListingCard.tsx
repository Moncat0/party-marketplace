'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import HeartButton from './HeartButton'
import WishlistSaveModal from '@/components/wishlist/WishlistSaveModal'
import { removeFromAllWishlists } from '@/lib/wishlists'

export type ListingCardData = {
  id: string
  service_title: string | null
  city: string | null
  photos: string[]
  category_tags?: string[]
  users?: { name: string | null; avatar_url?: string | null } | null
  avgRating?: number | null
  reviewCount?: number
  price_range_min?: number | null
}

type Props = {
  data: ListingCardData
  isLoggedIn?: boolean
  initialSaved?: boolean
  plannerId?: string | null
  onUnsave?: () => void | Promise<void>
}

/**
 * Live Airbnb Experiences card (audited from airbnb.se homepage):
 * aspect 20/19, radius 20px, meta gap 8px.
 * Text: title → muted subtitle → "From … · ★ rating" (DESIGN.md Homes
 * cards put ★ on the title row; live Experiences put it with the price).
 */
export default function ListingCard({
  data,
  isLoggedIn = false,
  initialSaved = false,
  plannerId = null,
  onUnsave,
}: Props) {
  const router = useRouter()
  const photo = data.photos[0]
  const [saved, setSaved] = useState(initialSaved)
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const isNew = !data.reviewCount
  const category = data.category_tags?.[0]
  // Live Experiences: single muted descriptor under the title (e.g. "Business host")
  const subtitle = category ?? data.city ?? 'Stockholm'
  const price =
    data.price_range_min != null
      ? `Från ${data.price_range_min.toLocaleString('sv-SE')} kr`
      : null
  const showRating =
    data.reviewCount != null && data.reviewCount > 0 && data.avgRating != null
  const priceRatingLine = [price, showRating ? `★ ${data.avgRating!.toFixed(2)}` : null]
    .filter(Boolean)
    .join(' · ')

  async function handleHeart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn || !plannerId) {
      window.location.href = `/signup?intent=planner&next=${encodeURIComponent(`/providers/${data.id}`)}`
      return
    }
    if (busy) return

    if (saved) {
      setBusy(true)
      try {
        if (onUnsave) await onUnsave()
        else await removeFromAllWishlists(plannerId, data.id)
        setSaved(false)
      } finally {
        setBusy(false)
      }
      return
    }

    setModalOpen(true)
  }

  return (
    <>
      <div
        onClick={() => router.push(`/providers/${data.id}`)}
        className="cursor-pointer group w-full"
      >
        {/* --card-layout_gap: 8px */}
        <div className="flex flex-col w-full gap-2">
          {/* --aspect_ratio_wrapper-ratio: 20/19 · --media-container_border-radius: 20px */}
          <div className="aspect-[20/19] w-full relative overflow-hidden bg-[#ebebeb] rounded-[20px]">
            {photo ? (
              <Image
                fill
                className="object-cover h-full w-full group-hover:scale-105 transition duration-300"
                src={photo}
                alt={data.service_title ?? 'Listing'}
                sizes="(max-width: 744px) 50vw, (max-width: 1128px) 20vw, (max-width: 1440px) 16vw, 14vw"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-4xl">🎉</div>
            )}

            {isNew && (
              <div className="absolute top-3 left-3 z-[1]">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-white text-[11px] font-semibold text-[#222222] shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px]">
                  Ny på FESTEN
                </span>
              </div>
            )}

            <div className="absolute top-3 right-3 z-[1]">
              <HeartButton saved={saved} onClick={handleHeart} size={32} />
            </div>
          </div>

          {/*
            Live Airbnb Experiences (airbnb.se): titles-medium_14_18 + body-text_14_18
            (0.875rem / 1.125rem, weight 500 / 400). Culprit vs our cards: <h3> was
            picking up globals.css Jakarta display face, which reads ~1 step larger
            than Cereal at the same px.
          */}
          <div className="flex flex-col gap-0.5 min-w-0 font-body text-[14px] leading-[18px]">
            <h3 className="font-body font-medium text-[14px] leading-[18px] text-[#222222] line-clamp-2">
              {data.service_title ?? 'Tjänst'}
            </h3>
            <p className="font-normal text-[#6a6a6a] truncate">{subtitle}</p>
            {priceRatingLine && (
              <p className="font-normal text-[#6a6a6a] truncate">{priceRatingLine}</p>
            )}
          </div>
        </div>
      </div>

      {plannerId && (
        <WishlistSaveModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          providerId={data.id}
          plannerId={plannerId}
          onSaved={() => setSaved(true)}
        />
      )}
    </>
  )
}
