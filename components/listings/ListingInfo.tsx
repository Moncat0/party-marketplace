'use client'

import Image from 'next/image'
import ListingCategory from './ListingCategory'
import { formatCategoryFromSlug } from '@/lib/categories'

type Props = {
  hostName: string | null
  hostAvatar: string | null
  categorySlug: string | null
  description: string | null
  city: string | null
  serviceTitle: string | null
  reviewCount: number
  avgRating: number | null
}

/** Left column under gallery — Airbnb listing body (reviews live full-width below). */
export default function ListingInfo({
  hostName,
  hostAvatar,
  categorySlug,
  description,
  city,
  serviceTitle,
  reviewCount,
  avgRating,
}: Props) {
  const initial = (hostName ?? '?').charAt(0).toUpperCase()
  const categoryLabel = formatCategoryFromSlug(categorySlug)

  return (
    <div className="col-span-4 flex flex-col gap-8">
      {/* Headline under photos */}
      <div className="flex flex-col gap-1 pb-6 border-b border-[#ebebeb]">
        <h2 className="text-[22px] font-semibold text-[#222222] tracking-[-0.02em]">
          {serviceTitle ?? 'Tjänst'}
          {city ? ` i ${city}` : ''}
        </h2>
        <p className="text-[16px] text-[#222222]">
          {[
            reviewCount === 0 && 'Ny på plattformen',
            reviewCount > 0 && avgRating != null && `★ ${avgRating.toFixed(1)} · ${reviewCount} recensioner`,
            city,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {/* Host row */}
      <div className="flex flex-row items-center gap-4 pb-6 border-b border-[#ebebeb]">
        {hostAvatar ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
            <Image src={hostAvatar} alt="" fill className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#222222] text-sm font-semibold text-white flex-shrink-0">
            {initial}
          </div>
        )}
        <div>
          <div className="text-[16px] font-semibold text-[#222222]">
            Erbjuds av {hostName ?? 'talang'}
          </div>
          <div className="text-[14px] text-[#6a6a6a]">Talang på FESTEN.</div>
        </div>
      </div>

      {categoryLabel && (
        <>
          <div className="flex flex-col gap-6">
            <ListingCategory label={categoryLabel} description={`Kategori · ${categoryLabel}`} />
          </div>
          <hr className="border-[#ebebeb]" />
        </>
      )}

      {description && (
        <div>
          <h3 className="text-[22px] font-semibold text-[#222222] mb-4">Om tjänsten</h3>
          <p className="text-[16px] text-[#222222] leading-[1.5] whitespace-pre-line">
            {description}
          </p>
        </div>
      )}
    </div>
  )
}
