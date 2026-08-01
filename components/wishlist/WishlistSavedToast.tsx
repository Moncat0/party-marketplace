'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export type WishlistToastData = {
  wishlistName: string
  photoUrl?: string | null
}

type Props = {
  data: WishlistToastData | null
  onChange: () => void
  onDismiss: () => void
  /** Auto-hide after ms (Airbnb ~8s). */
  durationMs?: number
}

/**
 * Airbnb-style “Saved to …” toast — bottom-left, Change reopens the picker.
 */
export default function WishlistSavedToast({
  data,
  onChange,
  onDismiss,
  durationMs = 8000,
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!data) return
    const t = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(t)
  }, [data, durationMs, onDismiss])

  if (!mounted || !data) return null

  return createPortal(
    <div
      role="status"
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 right-4 z-[70] mx-auto flex max-w-[min(100vw-2rem,420px)] items-center gap-3 rounded-xl bg-white py-3 pl-3 pr-4 shadow-[0_6px_20px_rgba(0,0,0,0.2)] sm:left-6 sm:right-auto"
    >
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[#ebebeb]">
        {data.photoUrl ? (
          <Image src={data.photoUrl} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg" aria-hidden>
            🎉
          </div>
        )}
      </div>

      <p className="min-w-0 flex-1 truncate text-[14px] font-normal leading-5 text-[#222222] font-body">
        Sparad i{' '}
        <span className="font-medium">{data.wishlistName}</span>
      </p>

      <Button
        type="button"
        variant="link"
        onClick={() => {
          onDismiss()
          onChange()
        }}
        className="h-auto flex-shrink-0 p-0 text-[14px] font-medium text-[#222222] underline underline-offset-2 hover:text-[#222222]"
      >
        Ändra
      </Button>
    </div>,
    document.body
  )
}
