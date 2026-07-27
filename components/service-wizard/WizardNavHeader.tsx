'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { siteChromePad, siteHeaderHeight, siteLogoClass } from '@/components/siteChrome'

type Props = {
  /** Where Avsluta / Spara & avsluta goes when using a link exit */
  exitHref?: string
  exitLabel?: string
  onExit?: () => void
  exitDisabled?: boolean
  /**
   * Keep the provider in the flow — logo is not a home link.
   * Default true for wizard surfaces.
   */
  trapNavigation?: boolean
  className?: string
}

/** Shared Frågor? / Avsluta bar used by the service wizard and wizard previews. */
export default function WizardNavHeader({
  exitHref = '/dashboard/listings',
  exitLabel = 'Avsluta',
  onExit,
  exitDisabled = false,
  trapNavigation = true,
  className,
}: Props) {
  return (
    <header
      className={cn(
        siteChromePad,
        'flex flex-shrink-0 items-center justify-between border-b border-[#ebebeb] bg-white',
        siteHeaderHeight,
        className
      )}
    >
      {trapNavigation ? (
        <span className={siteLogoClass} aria-hidden>
          FESTEN.
        </span>
      ) : (
        <Link href="/" className={siteLogoClass}>
          FESTEN.
        </Link>
      )}
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-10 rounded-full border-[#222222] px-4 text-[14px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]"
        >
          <Link href="/hjalp">Frågor?</Link>
        </Button>
        {onExit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exitDisabled}
            onClick={onExit}
            className="h-10 rounded-full border-[#222222] px-4 text-[14px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]"
          >
            {exitDisabled ? 'Sparar...' : exitLabel}
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 rounded-full border-[#222222] px-4 text-[14px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]"
          >
            <Link href={exitHref}>{exitLabel}</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
