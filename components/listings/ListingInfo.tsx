'use client'

import Image from 'next/image'
import { formatOccasion } from '@/lib/occasions'

type Props = {
  hostName: string | null
  hostAvatar: string | null
  occasions?: string[] | null
  description: string | null
  city: string | null
  canTravel?: boolean
  serviceTitle: string | null
  reviewCount: number
  avgRating: number | null
}

/** Left column under gallery — Airbnb listing body (reviews live full-width below). */
export default function ListingInfo({
  hostName,
  hostAvatar,
  occasions,
  description,
  city,
  canTravel = false,
  serviceTitle,
  reviewCount,
  avgRating,
}: Props) {
  const initial = (hostName ?? '?').charAt(0).toUpperCase()
  const occasionLabels = (occasions ?? [])
    .map(v => formatOccasion(v))
    .filter(Boolean) as string[]

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
          <div className="text-[14px] text-[#6a6a6a]">Talang på Gigtorget</div>
        </div>
      </div>

      <div className="flex items-start gap-4 pb-6 border-b border-[#ebebeb]">
        <span
          className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f7f7f7] text-[#222222]"
          aria-hidden
        >
          {canTravel ? <TravelIcon /> : <PinIcon />}
        </span>
        <div>
          <p className="text-[16px] font-semibold text-[#222222]">
            {canTravel ? 'Kan resa' : 'Endast lokalt'}
          </p>
          <p className="mt-0.5 text-[14px] leading-relaxed text-[#6a6a6a]">
            {canTravel
              ? 'Talangen kan komma till dig utanför sin basstad.'
              : city
                ? `Erbjuds lokalt i ${city}.`
                : 'Erbjuds lokalt i basstaden.'}
          </p>
        </div>
      </div>

      {occasionLabels.length > 0 && (
        <>
          <div>
            <h3 className="mb-3 text-[18px] font-semibold text-[#222222]">Passar för</h3>
            <div className="flex flex-wrap gap-2">
              {occasionLabels.map(label => (
                <span
                  key={label}
                  className="rounded-full border border-[#dddddd] bg-[#f7f7f7] px-3 py-1.5 text-[13px] font-medium text-[#222222]"
                >
                  {label}
                </span>
              ))}
            </div>
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

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function TravelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 17h18" />
      <path d="M5 17V9l4-2 3 1 4-2 3 1v10" />
      <path d="M7 17v2M17 17v2" />
    </svg>
  )
}
