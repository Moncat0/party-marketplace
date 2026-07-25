'use client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/**
 * Airbnb-clone page shell — from
 * https://github.com/Luancss/next13-airbnb-clone/blob/master/app/components/Container.tsx
 *
 * Centers content with a very wide max width and responsive side padding.
 * Navbar and page body should both use this so edges align.
 */
export default function Container({ children }: Props) {
  return (
    <div
      className="
        max-w-[2520px]
        mx-auto
        xl:px-20
        md:px-10
        sm:px-2
        px-4
      "
    >
      {children}
    </div>
  )
}
