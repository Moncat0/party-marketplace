'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ResultsSearchSegment = 'where' | 'service'

type Props = {
  locationLabel: string
  serviceLabel: string
  /** Opens full search focused on that segment. */
  onExpand?: (segment: ResultsSearchSegment) => void
  onSearch?: () => void
  className?: string
}

/**
 * Airbnb Services “little search” for results pages.
 * Click location or service to expand the full bar + that dropdown.
 */
export default function ResultsSearchPill({
  locationLabel,
  serviceLabel,
  onExpand,
  onSearch,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex h-12 w-max max-w-[min(100vw-2rem,560px)] items-center rounded-full border border-[#DDDDDD] bg-background',
        'shadow-[0_1px_2px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)]',
        'transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onExpand?.('where')}
        className="flex items-center gap-2 whitespace-nowrap rounded-l-full py-1.5 pl-3 pr-3.5 text-left transition-colors hover:bg-[#F7F7F7]"
      >
        <BellIcon />
        <span className="text-[14px] font-semibold leading-none text-foreground">
          Services in {locationLabel}
        </span>
      </button>

      <div className="h-5 w-px flex-shrink-0 bg-border" aria-hidden />

      <button
        type="button"
        onClick={() => onExpand?.('service')}
        className="whitespace-nowrap py-1.5 pl-3.5 pr-2.5 text-left transition-colors hover:bg-[#F7F7F7]"
      >
        <span className="text-[14px] font-semibold leading-none text-foreground">
          {serviceLabel}
        </span>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={e => {
          e.stopPropagation()
          onSearch?.()
        }}
        className="mr-1.5 h-8 w-8 flex-shrink-0 rounded-full bg-primary p-0 text-primary-foreground shadow-none hover:bg-primary/90 hover:text-primary-foreground"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </Button>
    </div>
  )
}

function BellIcon() {
  return (
    <span
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
      aria-hidden
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </span>
  )
}
