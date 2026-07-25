'use client'

import type { MouseEvent } from 'react'

type Props = {
  saved: boolean
  onClick: (e: MouseEvent) => void
  size?: number
}

/** Circular wishlist heart — Airbnb icon-button style. */
export default function HeartButton({ saved, onClick, size = 28 }: Props) {
  const fillSize = size - 4
  return (
    <button
      type="button"
      aria-label={saved ? 'Sparad' : 'Spara'}
      onClick={onClick}
      className="relative flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
      style={{ width: size + 4, height: size + 4 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="rgba(0,0,0,0.5)"
        stroke="white"
        strokeWidth="1.5"
        className="absolute"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <svg
        width={fillSize}
        height={fillSize}
        viewBox="0 0 24 24"
        fill={saved ? '#FF6B35' : 'rgba(0,0,0,0.5)'}
        stroke="white"
        strokeWidth="1.5"
        className="relative"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
