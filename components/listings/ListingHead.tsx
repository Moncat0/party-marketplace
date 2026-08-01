'use client'

import Image from 'next/image'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  photos: string[]
  saved: boolean
  copied?: boolean
  onSave: (e: MouseEvent) => void
  onShare: () => void
  onShowAll?: () => void
  /** Hide save for owner preview of draft/paused listings */
  hideSave?: boolean
  hideShare?: boolean
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
  hideSave = false,
  hideShare = false,
}: Props) {
  const hasPhotos = photos.length > 0
  const showMosaic = photos.length >= 2

  return (
    <div className="flex flex-col gap-6">
      {/* Title + Share / Save — same row, flat underlined actions */}
      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
        <h1 className="min-w-0 flex-1 text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[26px]">
          {title}
        </h1>
        {!(hideSave && hideShare) ? (
        <div className="-mr-1 flex flex-shrink-0 items-center gap-0 sm:-mr-2">
          {!hideShare ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onShare}
            aria-label={copied ? 'Kopierad' : 'Dela'}
            className="h-11 min-w-11 gap-2 rounded-lg px-2.5 py-2 text-[14px] font-semibold text-foreground underline underline-offset-2 hover:bg-accent sm:h-auto sm:px-3"
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path
                d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9M16 4v18M8 11l8-8 8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">{copied ? 'Kopierad' : 'Dela'}</span>
          </Button>
          ) : null}
          {!hideSave ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onSave}
              aria-label={saved ? 'Sparad' : 'Spara'}
              className="h-11 min-w-11 gap-2 rounded-lg px-2.5 py-2 text-[14px] font-semibold text-foreground underline underline-offset-2 hover:bg-accent sm:h-auto sm:px-3"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 32 32"
                fill={saved ? 'hsl(var(--primary))' : 'none'}
                stroke={saved ? 'hsl(var(--primary))' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M16 28s-12-7.5-12-15a6.5 6.5 0 0 1 12-3.5A6.5 6.5 0 0 1 28 13c0 7.5-12 15-12 15z" />
              </svg>
              <span className="hidden sm:inline">{saved ? 'Sparad' : 'Spara'}</span>
            </Button>
          ) : null}
        </div>
        ) : null}
      </div>

      {/* Photo mosaic — large left + 2×2 right, white gaps, each tile rounded */}
      {showMosaic && (
        <div className="relative">
          <div className="grid h-[280px] grid-cols-1 gap-2 sm:h-[320px] sm:grid-cols-2 md:h-[380px]">
            <div className="relative h-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={photos[0]}
                alt={title}
                fill
                priority
                className="object-cover transition hover:brightness-95"
                sizes="(max-width: 640px) 100vw, 560px"
              />
            </div>
            <div className="hidden h-full grid-cols-2 grid-rows-2 gap-2 sm:grid">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`relative overflow-hidden bg-muted ${
                    i === 2 ? 'rounded-tr-xl' : ''
                  } ${i === 4 ? 'rounded-br-xl' : ''}`}
                >
                  {photos[i] ? (
                    <Image
                      src={photos[i]}
                      alt=""
                      fill
                      className="object-cover transition hover:brightness-95"
                      sizes="280px"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {(photos.length > 1 || onShowAll) && (
            <Button
              type="button"
              variant="outline"
              onClick={onShowAll}
              className="absolute bottom-4 right-4 h-9 gap-2 rounded-lg border-foreground px-3.5 text-[14px] font-semibold text-foreground shadow-sm hover:bg-accent"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z" />
              </svg>
              Visa alla foton
            </Button>
          )}
        </div>
      )}

      {hasPhotos && !showMosaic && (
        <div className="relative h-[320px] overflow-hidden rounded-xl bg-muted md:h-[380px]">
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
        <div className="flex h-[280px] items-center justify-center rounded-xl bg-muted">
          <span className="text-6xl" aria-hidden>
            🎉
          </span>
        </div>
      )}
    </div>
  )
}
