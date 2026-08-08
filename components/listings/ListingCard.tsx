'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import HeartButton from './HeartButton'
import WishlistSaveModal from '@/components/wishlist/WishlistSaveModal'
import { formatCategoryFromSlug, resolveCategorySlug } from '@/lib/categories'
import {
  fetchUserWishlists,
  getCachedWishlists,
  prefetchUserWishlists,
  removeFromAllWishlists,
} from '@/lib/wishlists'
import { useProviderWishlistSaved } from '@/lib/wishlist-saved-state'
import { openAuth } from '@/lib/open-auth'

export type ListingCardData = {
  id: string
  title: string | null
  city: string | null
  photos: string[]
  category_slug?: string | null
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
  /**
   * explore — homepage rows: square photo, Homes-style meta (Airbnb explore).
   * services — search results: 3/2 landscape (Airbnb Services).
   */
  variant?: 'explore' | 'services'
}

/**
 * Marketplace listing card.
 * - explore: square 1:1, ~7-up on desktop homepage rows
 * - services: 3/2 landscape for /sok search grid
 */
export default function ListingCard({
  data,
  isLoggedIn = false,
  initialSaved = false,
  plannerId = null,
  onUnsave,
  variant = 'services',
}: Props) {
  const router = useRouter()
  const photo = data.photos[0]
  const { saved, markSaved, markUnsaved } = useProviderWishlistSaved(
    data.id,
    initialSaved
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Warm wishlist cache so the save modal opens with real lists, not a skeleton.
  useEffect(() => {
    if (plannerId) prefetchUserWishlists(plannerId)
  }, [plannerId])

  const reviewCount = data.reviewCount ?? 0
  const isNew = reviewCount === 0
  const category = formatCategoryFromSlug(
    resolveCategorySlug({
      category_slug: data.category_slug,
      category_tags: data.category_tags,
    })
  )
  const price =
    data.price_range_min != null
      ? `Från ${data.price_range_min.toLocaleString('sv-SE')} kr`
      : null
  const showRating = reviewCount > 0 && data.avgRating != null
  const ratingLabel = showRating
    ? Number.isInteger(data.avgRating!)
      ? data.avgRating!.toFixed(1)
      : data.avgRating!.toFixed(2)
    : null

  async function handleHeart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn || !plannerId) {
      openAuth({ intent: 'planner', next: `/tjanster/${data.id}` })
      return
    }
    if (busy) return

    if (saved) {
      setBusy(true)
      try {
        if (onUnsave) await onUnsave()
        else await removeFromAllWishlists(plannerId, data.id)
        markUnsaved()
      } finally {
        setBusy(false)
      }
      return
    }

    // Ensure lists are ready before opening — avoids the 4-tile skeleton flash.
    if (!getCachedWishlists(plannerId)) {
      setBusy(true)
      try {
        await fetchUserWishlists(plannerId)
      } catch {
        // Open anyway; modal will show skeleton / error path.
      } finally {
        setBusy(false)
      }
    }
    setModalOpen(true)
  }

  function warmWishlists() {
    if (plannerId) prefetchUserWishlists(plannerId)
  }

  return (
    <>
      <div
        onClick={() => router.push(`/tjanster/${data.id}`)}
        className="group w-full cursor-pointer"
      >
        <div className="flex w-full flex-col gap-2">
          <div
            className={`relative w-full overflow-hidden bg-[#ebebeb] ${
              variant === 'explore'
                ? 'aspect-square rounded-xl'
                : 'aspect-[3/2] rounded-[24px]'
            }`}
          >
            {photo ? (
              <Image
                fill
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                src={photo}
                alt={data.title ?? 'Listing'}
                sizes={
                  variant === 'explore'
                    ? '(max-width: 744px) 50vw, (max-width: 1128px) 20vw, (max-width: 1440px) 14vw, 12vw'
                    : '(max-width: 744px) 50vw, (max-width: 1128px) 33vw, (max-width: 1440px) 25vw, 20vw'
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">🎉</div>
            )}

            {isNew && (
              <div className="absolute left-3 top-3 z-[1]">
                <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-[#222222] shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px]">
                  Ny på Festly
                </span>
              </div>
            )}

            {/* Airbnb: 12px inset from photo edges (top-3 / right-3) */}
            <div
              className="absolute right-3 top-3 z-[1]"
              onPointerEnter={warmWishlists}
              onFocus={warmWishlists}
              onClick={e => e.stopPropagation()}
            >
              <HeartButton saved={saved} onClick={handleHeart} size={24} />
            </div>
          </div>

          {variant === 'explore' ? (
            <div className="flex min-w-0 flex-col gap-0.5 font-body">
              <h3 className="truncate text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[#222222]">
                {data.title ?? 'Tjänst'}
              </h3>
              {(category || data.city) && (
                <p className="truncate text-[15px] font-normal leading-5 text-[#6A6A6A]">
                  {[category, data.city].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex items-baseline justify-between gap-2">
                {price ? (
                  <p className="min-w-0 truncate text-[15px] font-semibold leading-5 text-[#222222]">
                    {price}
                  </p>
                ) : (
                  <span />
                )}
                {showRating && (
                  <p className="flex flex-shrink-0 items-center gap-[2px] text-[15px] font-normal leading-5 text-[#222222]">
                    <StarIcon />
                    <span className="ml-0.5">{ratingLabel}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col font-body">
              <h3 className="line-clamp-2 text-[14px] font-medium leading-[18px] tracking-[-0.01em] text-[#222222]">
                {data.title ?? 'Tjänst'}
              </h3>

              {category && (
                <p className="truncate text-[12px] font-normal leading-4 tracking-[-0.005em] text-[#6A6A6A]">
                  {category}
                </p>
              )}

              {showRating && (
                <p className="flex items-center gap-[2px] text-[12px] font-normal leading-4 tracking-[-0.005em] text-[#6A6A6A]">
                  <StarIcon />
                  <span className="ml-0.5">{ratingLabel}</span>
                  <span className="mx-0.5" aria-hidden>
                    ·
                  </span>
                  <span>{reviewCount}</span>
                </p>
              )}

              {price && (
                <p className="truncate text-[12px] font-normal leading-4 tracking-[-0.005em] text-[#6A6A6A]">
                  {price}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {plannerId && (
        <WishlistSaveModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onOpen={() => setModalOpen(true)}
          providerId={data.id}
          plannerId={plannerId}
          providerPhoto={photo}
          onSaved={markSaved}
        />
      )}
    </>
  )
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="12"
      height="12"
      aria-hidden
      className="relative top-px flex-shrink-0 fill-current text-current"
    >
      <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.705l7.19 6.549-1.875 9.745a1 1 0 0 0 1.451 1.054L16 25.577l8.666 4.21a1 1 0 0 0 1.451-1.054l-1.875-9.745 7.19-6.549a1 1 0 0 0-.542-1.706l-9.86-1.269-4.124-8.885a1 1 0 0 0-1.812 0z" />
    </svg>
  )
}
