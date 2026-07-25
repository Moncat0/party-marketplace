'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed'

/** Airbnb-style “Recently viewed” wishlist card. */
export default function RecentlyViewedCard() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    setItems(getRecentlyViewed())
  }, [])

  if (items.length === 0) {
    return (
      <Link href="/" className="group block min-w-0">
        <div
          className="aspect-square bg-[#dddddd] flex items-center justify-center transition group-hover:brightness-[0.97]"
          style={{ borderRadius: 16 }}
        >
          <RecentlyIcon />
        </div>
        <p className="mt-3 text-[15px] font-semibold text-[#222222] leading-5">
          Nyligen visade
        </p>
      </Link>
    )
  }

  const cover = items[0]?.photo

  return (
    <Link href="/planner/shortlist/recent" className="group block min-w-0">
      <div
        className="relative aspect-square overflow-hidden bg-[#dddddd] transition group-hover:brightness-[0.97]"
        style={{ borderRadius: 16 }}
      >
        {cover ? (
          <Image src={cover} alt="" fill className="object-cover" sizes="280px" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <RecentlyIcon />
          </div>
        )}
      </div>
      <p className="mt-3 text-[15px] font-semibold text-[#222222] leading-5 truncate">
        Nyligen visade
      </p>
      <p className="text-[15px] text-[#6a6a6a] leading-5">
        {items.length} {items.length === 1 ? 'visad' : 'visade'}
      </p>
    </Link>
  )
}

function RecentlyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12z"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M16 10v6l4 2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.5A9 9 0 0 1 16 7"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
