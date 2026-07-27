'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Airbnb Services-style search pill — Var + Typ av tjänst.
 *
 * Hover / active fill (audited from Airbnb Jul 2026):
 * - Shell is `overflow-hidden rounded-full` so segment fills clip into the outer curve.
 * - Rest: white shell. Hovered segment = light-gray full-height pill (no vertical gaps).
 * - Focused: gray shell + 6px inset. Active = white elevated full-height pill;
 *   hover on another segment = darker gray full-height pill.
 * - Dividers hide next to hovered/active segments.
 */

const EASE = 'cubic-bezier(0.2, 0, 0, 1)'
const DURATION = '280ms'

export type SearchSegment = 'where' | 'service'

type Props = {
  locationLabel?: string
  serviceLabel?: string
  locationTitle?: string
  serviceTitle?: string
  onLocationClick?: () => void
  onServiceClick?: () => void
  onSearch?: () => void
  onClearLocation?: () => void
  onClearService?: () => void
  active?: SearchSegment | null
  compact?: boolean
  hasLocationValue?: boolean
  hasServiceValue?: boolean
  maxWidth?: number
}

export default function Search({
  locationLabel = 'Sök destinationer',
  serviceLabel = 'Lägg till tjänst',
  locationTitle = 'Var',
  serviceTitle = 'Tjänst',
  onLocationClick,
  onServiceClick,
  onSearch,
  onClearLocation,
  onClearService,
  active = null,
  compact = false,
  hasLocationValue = false,
  hasServiceValue = false,
  maxWidth,
}: Props) {
  const focused = !compact && active != null
  const [hovered, setHovered] = useState<SearchSegment | null>(null)

  // Hide divider when either adjacent segment is hovered/active (Airbnb).
  const showDivider =
    hovered == null &&
    active == null &&
    (compact || !focused)

  // Compact must fit “Sök destinationer” + “Lägg till tjänst” + icon button.
  // Full must fit labeled empty state (and clear chips) without clipping.
  const shellMax = maxWidth ?? (compact ? 380 : 680)

  return (
    <div
      className="hidden md:flex items-stretch overflow-hidden rounded-full will-change-[max-width,padding,box-shadow,background-color]"
      onMouseLeave={() => setHovered(null)}
      style={{
        width: shellMax,
        maxWidth: '100%',
        // Focused: inset so the white active pill sits inside the gray shell.
        // Rest / compact: no inset — hover fill must reach the outer curves.
        padding: compact ? '4px 4px 4px 6px' : focused ? 6 : 0,
        backgroundColor: focused ? '#EBEBEB' : '#FFFFFF',
        border: focused ? '1px solid transparent' : '1px solid #DDDDDD',
        boxShadow: compact
          ? 'rgba(0, 0, 0, 0.08) 0px 1px 2px, rgba(0, 0, 0, 0.04) 0px 2px 6px'
          : focused
            ? 'rgba(0, 0, 0, 0.15) 0px 16px 32px, rgba(0, 0, 0, 0.1) 0px 3px 8px'
            : 'rgba(0, 0, 0, 0.08) 0px 1px 2px, rgba(0, 0, 0, 0.05) 0px 4px 12px',
        transition: `
          width ${DURATION} ${EASE},
          max-width ${DURATION} ${EASE},
          padding ${DURATION} ${EASE},
          box-shadow ${DURATION} ${EASE},
          background-color ${DURATION} ${EASE},
          border-color ${DURATION} ${EASE}
        `,
      }}
    >
      <Segment
        compact={compact}
        focused={focused}
        active={active === 'where'}
        hovered={hovered === 'where'}
        label={locationTitle}
        value={locationLabel}
        onClick={onLocationClick ?? onSearch}
        onClear={hasLocationValue && active === 'where' ? onClearLocation : undefined}
        className="min-w-0 flex-1"
        padLeft
        filled={hasLocationValue}
        showDivider={showDivider && hovered !== 'where' && active !== 'where'}
        onHover={() => setHovered('where')}
      />

      <Segment
        compact={compact}
        focused={focused}
        active={active === 'service'}
        hovered={hovered === 'service'}
        label={serviceTitle}
        value={serviceLabel}
        onClick={onServiceClick ?? onSearch}
        onClear={hasServiceValue && active === 'service' ? onClearService : undefined}
        className="min-w-0 flex-1"
        filled={hasServiceValue}
        onHover={() => setHovered('service')}
      />

      {/* Outside segments so equal flex columns both fit their labels */}
      <div
        className={cn(
          'flex flex-shrink-0 items-center self-center',
          compact ? 'pr-0.5' : focused ? 'pr-0' : 'pr-1.5'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={e => {
            e.stopPropagation()
            onSearch?.()
          }}
          aria-label="Sök"
          className="h-auto w-auto flex-shrink-0 p-0 shadow-none hover:bg-transparent"
        >
          <SearchButton compact={compact} expanded={focused} />
        </Button>
      </div>
    </div>
  )
}

function Segment({
  label,
  value,
  onClick,
  onClear,
  className = '',
  compact,
  focused,
  active,
  hovered,
  padLeft,
  showDivider,
  filled,
  onHover,
}: {
  label: string
  value: string
  onClick?: () => void
  onClear?: () => void
  className?: string
  compact: boolean
  focused: boolean
  active: boolean
  hovered: boolean
  padLeft?: boolean
  showDivider?: boolean
  filled?: boolean
  onHover?: () => void
}) {
  const strong = compact || !!filled

  // Full-height pill fill — Airbnb: active white / hover gray stretches edge-to-edge
  // inside the shell (clipped by overflow-hidden on the outer pill when at rest).
  const surface = active
    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] relative z-[1]'
    : hovered
      ? focused
        ? 'bg-[#DDDDDD] relative z-[1]'
        : 'bg-[#EBEBEB] relative z-[1]'
      : 'bg-transparent'

  return (
    <div
      className={cn(
        'relative flex min-h-0 min-w-0 flex-row items-stretch self-stretch rounded-full',
        surface,
        className
      )}
      style={{
        transition: `background-color ${DURATION} ${EASE}, box-shadow ${DURATION} ${EASE}`,
      }}
      onMouseEnter={onHover}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-0 min-w-0 flex-1 flex-col items-start justify-center rounded-full text-left"
        style={{
          paddingTop: compact ? 2 : 14,
          paddingBottom: compact ? 2 : 14,
          paddingLeft: padLeft ? (compact ? 10 : 20) : compact ? 8 : 14,
          paddingRight: onClear ? 6 : compact ? 8 : 14,
          transition: `padding ${DURATION} ${EASE}`,
        }}
      >
        <span
          className="whitespace-nowrap font-semibold leading-tight text-foreground"
          style={{
            fontSize: compact ? 0 : 12,
            opacity: compact ? 0 : 1,
            maxHeight: compact ? 0 : 16,
            marginBottom: compact ? 0 : 2,
            transition: `
              opacity ${DURATION} ${EASE},
              max-height ${DURATION} ${EASE},
              font-size ${DURATION} ${EASE},
              margin ${DURATION} ${EASE}
            `,
          }}
        >
          {label}
        </span>
        <span
          className={cn(
            'max-w-full whitespace-nowrap leading-tight',
            compact ? 'text-[13px]' : 'text-sm',
            strong ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'
          )}
        >
          {value}
        </span>
      </button>

      {onClear && (
        <button
          type="button"
          aria-label="Rensa"
          onClick={e => {
            e.stopPropagation()
            onClear()
          }}
          className="my-auto mr-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DDDDDD] text-foreground hover:bg-[#c1c1c1]"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showDivider && (
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-1/2 w-px -translate-y-1/2 bg-[#DDDDDD]',
            compact ? 'h-5' : 'h-8'
          )}
          aria-hidden
        />
      )}
    </div>
  )
}

function SearchButton({ compact, expanded }: { compact: boolean; expanded: boolean }) {
  const height = compact ? 32 : 48
  const icon = compact ? 12 : 16
  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
      style={{
        height,
        width: compact ? 32 : expanded ? 'auto' : 48,
        paddingLeft: compact ? 0 : expanded ? 16 : 0,
        paddingRight: compact ? 0 : expanded ? 20 : 0,
        gap: expanded ? 8 : 0,
        transition: `
          width ${DURATION} ${EASE},
          height ${DURATION} ${EASE},
          padding ${DURATION} ${EASE},
          background-color 150ms ${EASE}
        `,
      }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <span
        className="overflow-hidden whitespace-nowrap"
        style={{
          maxWidth: expanded && !compact ? 64 : 0,
          opacity: expanded && !compact ? 1 : 0,
          fontSize: 15,
          transition: `max-width ${DURATION} ${EASE}, opacity ${DURATION} ${EASE}`,
        }}
      >
        Sök
      </span>
    </div>
  )
}
