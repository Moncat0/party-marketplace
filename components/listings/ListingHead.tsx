'use client'

import Image from 'next/image'
import type { MouseEvent } from 'react'

type Props = {
  title: string
  photos: string[]
  saved: boolean
  copied?: boolean
  onSave: (e: MouseEvent) => void
  onShare: () => void
  onShowAll?: () => void
}

/**
 * Airbnb listing head — matches live listing chrome:
 * title + Share/Save on one row, then photo mosaic with per-tile radius + gaps.
 */
export default function ListingHead({
  title,
  photos,
  saved,
  copied = false,
  onSave,
  onShare,
  onShowAll,
}: Props) {
  const hasPhotos = photos.length > 0
  const showMosaic = photos.length >= 2

  return (
    <div className="flex flex-col gap-6">
      {/* Title + Share / Save — same row, flat underlined actions */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[26px] font-semibold text-[#222222] tracking-[-0.02em] leading-[1.15] min-w-0">
          {title}
        </h1>
        <div className="flex items-center gap-0 flex-shrink-0 -mr-2">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 px-3 py-2 text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:bg-[#f7f7f7] rounded-lg transition-colors"
          >
            {/* Upload/share arrow — Airbnb icon */}
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path
                d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9M16 4v18M8 11l8-8 8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copied ? 'Kopierad' : 'Dela'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 px-3 py-2 text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:bg-[#f7f7f7] rounded-lg transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 32 32"
              fill={saved ? '#FF6B35' : 'none'}
              stroke={saved ? '#FF6B35' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M16 28s-12-7.5-12-15a6.5 6.5 0 0 1 12-3.5A6.5 6.5 0 0 1 28 13c0 7.5-12 15-12 15z" />
            </svg>
            {saved ? 'Sparad' : 'Spara'}
          </button>
        </div>
      </div>

      {/* Photo mosaic — large left + 2×2 right, white gaps, each tile rounded */}
      {showMosaic && (
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-[280px] sm:h-[320px] md:h-[380px]">
            <div className="relative h-full overflow-hidden rounded-xl bg-[#ebebeb]">
              <Image
                src={photos[0]}
                alt={title}
                fill
                priority
                className="object-cover hover:brightness-95 transition"
                sizes="(max-width: 640px) 100vw, 560px"
              />
            </div>
            <div className="hidden sm:grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`relative overflow-hidden bg-[#ebebeb] ${
                    i === 2 ? 'rounded-tr-xl' : ''
                  } ${i === 4 ? 'rounded-br-xl' : ''}`}
                >
                  {photos[i] ? (
                    <Image
                      src={photos[i]}
                      alt=""
                      fill
                      className="object-cover hover:brightness-95 transition"
                      sizes="280px"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#f2f2f2]" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {(photos.length > 1 || onShowAll) && (
            <button
              type="button"
              onClick={onShowAll}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 h-9 px-3.5 text-[14px] font-semibold text-[#222222] bg-white border border-[#222222] hover:bg-[#f7f7f7] transition-colors shadow-sm rounded-lg"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z" />
              </svg>
              Visa alla foton
            </button>
          )}
        </div>
      )}

      {hasPhotos && !showMosaic && (
        <div className="relative h-[320px] md:h-[380px] overflow-hidden rounded-xl bg-[#ebebeb]">
          <Image
            src={photos[0]}
            alt={title}
            fill
            priority
            className="object-cover"
            sizes="1024px"
          />
        </div>
      )}

      {!hasPhotos && (
        <div className="h-[280px] rounded-xl bg-[#f2f2f2] flex items-center justify-center">
          <span className="text-6xl" aria-hidden>
            🎉
          </span>
        </div>
      )}
    </div>
  )
}
