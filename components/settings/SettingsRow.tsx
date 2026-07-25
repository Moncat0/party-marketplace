'use client'

import type { ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

type Props = {
  label: string
  value?: string | null
  emptyLabel?: string
  description?: string
  actionLabel: string
  onAction: () => void
  expanded?: boolean
  children?: ReactNode
  isLast?: boolean
}

/** Airbnb-style settings list row: label + value + Edit/Add, expands inline. */
export default function SettingsRow({
  label,
  value,
  emptyLabel = 'Ej angivet',
  description,
  actionLabel,
  onAction,
  expanded = false,
  children,
  isLast = false,
}: Props) {
  const display = value?.trim() ? value : emptyLabel

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${t.colors.hairlineSoft}`,
        paddingTop: 28,
        paddingBottom: 28,
      }}
    >
      <div className="flex items-start justify-between gap-8 w-full">
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-[16px] font-medium leading-[1.25] text-[#222222]">{label}</p>
          {!expanded && (
            <>
              {description && (
                <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mt-1.5 max-w-2xl">
                  {description}
                </p>
              )}
              <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mt-1.5">{display}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onAction}
          className="flex-shrink-0 text-[14px] font-medium text-[#222222] underline underline-offset-[3px] hover:text-[#6a6a6a] transition-colors pt-0.5"
          style={{ transitionDuration: t.motion.fast }}
        >
          {expanded ? 'Avbryt' : actionLabel}
        </button>
      </div>
      {expanded && children && <div className="mt-5 max-w-lg space-y-4">{children}</div>}
    </div>
  )
}
