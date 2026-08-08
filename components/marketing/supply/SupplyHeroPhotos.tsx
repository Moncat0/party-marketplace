'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { SUPPLY_HERO_PHOTOS } from '@/components/marketing/supply/content'
import { cn } from '@/lib/utils'

export default function SupplyHeroPhotos() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % SUPPLY_HERO_PHOTOS.length)
    }, 2500)
    return () => window.clearInterval(id)
  }, [])

  const current = SUPPLY_HERO_PHOTOS[index]

  return (
    /* Padding reserves space for the -18px pink offset so it never crowds the nav */
    <div className="relative mx-auto w-full max-w-md pt-[22px] pl-[22px] lg:max-w-none">
      <div
        className="supply-hero-panel absolute left-0 top-0 z-0 h-[calc(100%-22px)] w-[calc(100%-22px)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--pink-500)]"
        style={{ animation: 'supplyFloatSlow 7s ease-in-out infinite' }}
        aria-hidden
      />
      <div className="relative z-[1] aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--ink-900)] shadow-[var(--shadow-soft-md)]">
        {SUPPLY_HERO_PHOTOS.map((photo, i) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.label}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 90vw, 420px"
            className={cn(
              'supply-hero-zoom object-cover transition-opacity duration-[900ms] ease-out',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
            style={
              i === index
                ? { animation: 'supplyHeroZoom 11s ease-in-out infinite alternate' }
                : undefined
            }
          />
        ))}
        <span className="supply-body absolute bottom-3.5 left-3.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white px-3 py-1 text-[13px] font-bold text-[var(--ink-900)]">
          {current.label}
        </span>
      </div>
      <div
        className="supply-hero-note absolute -bottom-[22px] right-0 z-[2] flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white px-5 py-3.5 shadow-[var(--shadow-soft-md)]"
        style={{ animation: 'supplyPulseNote 4s ease-in-out infinite' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" aria-hidden>
          <path d="M12 3l2.6 6.2L21 10l-5 4.4L17.4 21 12 17.3 6.6 21 8 14.4 3 10l6.4-.8z" />
        </svg>
        <span className="supply-hand text-[var(--ink-900)]">Alltid en vibe</span>
      </div>
    </div>
  )
}
