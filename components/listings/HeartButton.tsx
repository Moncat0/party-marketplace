'use client'

import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  saved: boolean
  onClick: (e: MouseEvent) => void
  /** Visual heart size in px. Airbnb explore uses 24. */
  size?: number
}

/**
 * Wishlist heart — matches live Airbnb property-card heart:
 * - Glyph: 24×24, white stroke 2, fill rgba(0,0,0,0.5) / brand when saved
 * - Hit target: 32×32
 * - Positioned by parent at top/right 12px (top-3 right-3)
 */
export default function HeartButton({ saved, onClick, size = 24 }: Props) {
  const hit = Math.max(32, size + 8)

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={saved ? 'Sparad' : 'Spara'}
      aria-pressed={saved}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-full p-0',
        'hover:bg-transparent hover:scale-110 active:scale-100',
        'focus-visible:ring-2 focus-visible:ring-white/80'
      )}
      style={{ width: hit, height: hit }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        aria-hidden
        focusable="false"
        className="block overflow-visible drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        style={{
          fill: saved ? '#FF6B35' : 'rgba(0,0,0,0.5)',
          stroke: 'rgb(255,255,255)',
          strokeWidth: 2,
        }}
      >
        {/* Airbnb property-card heart path */}
        <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
      </svg>
    </Button>
  )
}
