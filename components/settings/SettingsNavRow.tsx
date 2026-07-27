'use client'

import type { ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

type Props = {
  label: string
  description?: string
  onClick: () => void
  /** Airbnb data-privacy: standalone bordered card */
  asCard?: boolean
  trailing?: ReactNode
}

/** Full-width tappable row with chevron — Airbnb data privacy style. */
export default function SettingsNavRow({
  label,
  description,
  onClick,
  asCard = false,
  trailing,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 text-left"
      style={
        asCard
          ? {
              border: `1px solid ${t.colors.hairlineSoft}`,
              borderRadius: 12,
              padding: '20px 20px',
              backgroundColor: t.colors.canvas,
            }
          : {
              paddingTop: 24,
              paddingBottom: 24,
            }
      }
    >
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-[1.25] text-[#222222]">{label}</p>
        {description && (
          <p className="mt-1 text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
            {description}
          </p>
        )}
      </div>
      {trailing ?? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#222222"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
          aria-hidden
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  )
}
