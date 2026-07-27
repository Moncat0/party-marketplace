'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { siteChromePad, siteHeaderHeight, siteLogoClass } from '@/components/siteChrome'

type Props = {
  children: React.ReactNode
  /** 0–1 fill for each of the three phases */
  phaseFills?: number[]
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
  showBack?: boolean
  onSaveExit?: () => void
  savingExit?: boolean
  /** Hub has no footer */
  hideFooter?: boolean
  contentClassName?: string
}

export default function ServiceWizardChrome({
  children,
  phaseFills = [0, 0, 0],
  onBack,
  onNext,
  nextLabel = 'Nästa',
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  onSaveExit,
  savingExit = false,
  hideFooter = false,
  contentClassName,
}: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header
        className={cn(
          siteChromePad,
          'flex flex-shrink-0 items-center justify-between',
          siteHeaderHeight
        )}
      >
        <Link href="/" className={siteLogoClass}>
          FESTEN.
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-10 rounded-full border-[#222222] px-4 text-[14px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]">
            <Link href="/hjalp">Frågor?</Link>
          </Button>
          {onSaveExit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingExit}
              onClick={onSaveExit}
              className="h-10 rounded-full border-[#222222] px-4 text-[14px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]"
            >
              {savingExit ? 'Sparar...' : 'Spara & avsluta'}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full border-[#222222] px-4 text-[14px] font-medium text-[#222222] shadow-none hover:bg-[#f7f7f7]">
              <Link href="/dashboard/listings">Avsluta</Link>
            </Button>
          )}
        </div>
      </header>

      <main
        className={cn(
          'flex flex-1 flex-col',
          hideFooter ? 'px-6 pb-16 pt-6 sm:px-10' : 'overflow-y-auto px-6 py-8 sm:px-10',
          contentClassName
        )}
      >
        {children}
      </main>

      {!hideFooter && (
        <footer className="flex-shrink-0">
          <div className="flex w-full gap-1.5 px-0">
            {phaseFills.map((fill, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden bg-[#dddddd]">
                <div
                  className="h-full bg-[#222222] transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min(1, Math.max(0, fill)) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div
            className={cn(
              siteChromePad,
              'flex items-center justify-between py-4'
            )}
          >
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#6a6a6a]"
              >
                Tillbaka
              </button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              variant="dark"
              disabled={nextDisabled || nextLoading}
              onClick={onNext}
              className="h-12 min-w-[120px] rounded-lg px-8 text-[16px] font-semibold disabled:bg-[#dddddd] disabled:text-white disabled:opacity-100"
            >
              {nextLoading ? '...' : nextLabel}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}
