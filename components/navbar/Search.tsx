'use client'

/**
 * Airbnb-style search pill — big at rest, little-search on scroll.
 *
 * Motion: 280ms / cubic-bezier(0.2, 0, 0, 1).
 */

const EASE = 'cubic-bezier(0.2, 0, 0, 1)'
const DURATION = '280ms'

type Props = {
  locationLabel?: string
  dateLabel?: string
  guestLabel?: string
  locationTitle?: string
  dateTitle?: string
  guestTitle?: string
  onLocationClick?: () => void
  onDateClick?: () => void
  onGuestClick?: () => void
  onSearch?: () => void
  /** Little-search when true; big-search labels when false. */
  compact?: boolean
}

export default function Search({
  locationLabel = 'Sök destinationer',
  dateLabel = 'Lägg till datum',
  guestLabel = 'Lägg till gäster',
  locationTitle = 'Var',
  dateTitle = 'När',
  guestTitle = 'Vem',
  onLocationClick,
  onDateClick,
  onGuestClick,
  onSearch,
  compact = false,
}: Props) {
  return (
    <div
      className="
        hidden md:flex
        items-center
        rounded-full
        border border-[#ddd]
        bg-white
        will-change-[max-width,padding,box-shadow]
      "
      style={{
        maxWidth: compact ? 420 : 850,
        width: '100%',
        paddingTop: compact ? 6 : 0,
        paddingBottom: compact ? 6 : 0,
        paddingLeft: compact ? 8 : 0,
        paddingRight: compact ? 6 : 8,
        boxShadow: compact
          ? 'rgba(0, 0, 0, 0.08) 0px 1px 2px, rgba(0, 0, 0, 0.04) 0px 2px 6px'
          : 'rgba(0, 0, 0, 0.08) 0px 1px 2px, rgba(0, 0, 0, 0.05) 0px 4px 12px',
        transition: `
          max-width ${DURATION} ${EASE},
          padding ${DURATION} ${EASE},
          box-shadow ${DURATION} ${EASE}
        `,
      }}
    >
      <Segment
        compact={compact}
        label={locationTitle}
        value={locationLabel}
        onClick={onLocationClick ?? onSearch}
        className="flex-[1.2] rounded-l-full"
        padLeft
      />
      <Divider compact={compact} />
      <Segment
        compact={compact}
        label={dateTitle}
        value={dateLabel}
        onClick={onDateClick ?? onSearch}
        className="flex-1"
      />
      <Divider compact={compact} />
      <div
        className="flex flex-1 items-center min-w-0 rounded-r-full hover:bg-[#ebebeb] transition-colors"
        style={{
          paddingLeft: compact ? 12 : 16,
          paddingRight: compact ? 4 : 8,
          paddingTop: compact ? 0 : 6,
          paddingBottom: compact ? 0 : 6,
          transition: `padding ${DURATION} ${EASE}`,
        }}
      >
        <button
          type="button"
          onClick={onGuestClick ?? onSearch}
          className="flex-1 text-left min-w-0"
          style={{
            paddingTop: compact ? 4 : 8,
            paddingBottom: compact ? 4 : 8,
            transition: `padding ${DURATION} ${EASE}`,
          }}
        >
          <div
            className="font-semibold text-[#222] leading-tight overflow-hidden"
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
            {guestTitle}
          </div>
          <div
            className="truncate leading-tight"
            style={{
              fontSize: 14,
              fontWeight: compact ? 600 : 400,
              color: compact ? '#222222' : '#717171',
              transition: `color ${DURATION} ${EASE}, font-weight ${DURATION} ${EASE}`,
            }}
          >
            {guestLabel}
          </div>
        </button>
        <button
          type="button"
          onClick={onSearch}
          aria-label="Sök"
          className="flex-shrink-0"
          style={{
            marginLeft: compact ? 4 : 8,
            transition: `margin ${DURATION} ${EASE}`,
          }}
        >
          <SearchButton compact={compact} />
        </button>
      </div>
    </div>
  )
}

function Segment({
  label,
  value,
  onClick,
  className = '',
  compact,
  padLeft,
}: {
  label: string
  value: string
  onClick?: () => void
  className?: string
  compact: boolean
  padLeft?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left min-w-0 hover:bg-[#ebebeb] transition-colors ${className}`}
      style={{
        paddingTop: compact ? 4 : 12,
        paddingBottom: compact ? 4 : 12,
        paddingLeft: padLeft ? (compact ? 16 : 32) : compact ? 12 : 16,
        paddingRight: compact ? 12 : 16,
        transition: `padding ${DURATION} ${EASE}`,
      }}
    >
      <div
        className="font-semibold text-[#222] leading-tight overflow-hidden"
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
      </div>
      <div
        className="truncate leading-tight"
        style={{
          fontSize: 14,
          fontWeight: compact ? 600 : 400,
          color: compact ? '#222222' : '#717171',
          transition: `color ${DURATION} ${EASE}`,
        }}
      >
        {value}
      </div>
    </button>
  )
}

function Divider({ compact }: { compact: boolean }) {
  return (
    <div
      className="bg-[#ddd] flex-shrink-0 self-center"
      style={{
        width: 1,
        height: compact ? 20 : 32,
        transition: `height ${DURATION} ${EASE}`,
      }}
    />
  )
}

function SearchButton({ compact }: { compact: boolean }) {
  const size = compact ? 32 : 48
  const icon = compact ? 14 : 18
  return (
    <div
      className="flex items-center justify-center rounded-full text-white bg-[#FF6B35] hover:bg-[#e55a26]"
      style={{
        width: size,
        height: size,
        transition: `
          width ${DURATION} ${EASE},
          height ${DURATION} ${EASE},
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
        style={{ transition: `width ${DURATION} ${EASE}, height ${DURATION} ${EASE}` }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </div>
  )
}
