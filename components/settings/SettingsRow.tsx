'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
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
  const hasValue = Boolean(value?.trim())
  const display = hasValue ? value : emptyLabel
  // Airbnb phone row: description replaces the empty value line
  const showValue = hasValue || !description

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
          <p className="text-[16px] font-semibold leading-[1.25] text-[#222222]">{label}</p>
          {!expanded && (
            <>
              {description && (
                <p className="mt-1.5 max-w-2xl text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                  {description}
                </p>
              )}
              {showValue && (
                <p className="mt-1.5 text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                  {display}
                </p>
              )}
            </>
          )}
        </div>
        <Button
          type="button"
          variant="link"
          onClick={onAction}
          className="h-auto flex-shrink-0 p-0 pt-0.5 text-[14px] font-medium text-foreground underline underline-offset-[3px] hover:text-muted-foreground"
          style={{ transitionDuration: t.motion.fast }}
        >
          {expanded ? 'Avbryt' : actionLabel}
        </Button>
      </div>
      {expanded && children && <div className="mt-5 max-w-lg space-y-4">{children}</div>}
    </div>
  )
}
