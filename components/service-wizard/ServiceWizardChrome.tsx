'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { siteChromePad } from '@/components/siteChrome'
import WizardNavHeader from '@/components/service-wizard/WizardNavHeader'

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
  /** Override Avsluta destination when not using onSaveExit */
  exitHref?: string
  className?: string
}

/**
 * Full-viewport wizard shell. Footer (Tillbaka / Nästa) stays pinned;
 * only the main column scrolls when a step is taller than the remaining space.
 */
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
  exitHref = '/dashboard/listings',
  className,
}: Props) {
  return (
    <div
      data-wizard-chrome
      className={cn(
        'flex h-dvh max-h-dvh flex-col overflow-hidden bg-white',
        className
      )}
    >
      <WizardNavHeader
        exitHref={exitHref}
        exitLabel={onSaveExit ? 'Spara & avsluta' : 'Avsluta'}
        onExit={onSaveExit}
        exitDisabled={savingExit}
        className="border-b-0"
      />

      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          hideFooter ? 'px-6 pb-16 pt-6 sm:px-10' : 'overflow-y-auto px-6 pb-6 pt-5 sm:px-10',
          contentClassName
        )}
      >
        {children}
      </main>

      {!hideFooter && (
        <footer className="flex-shrink-0 border-t border-transparent bg-white">
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
          <div className={cn(siteChromePad, 'flex items-center justify-between py-3.5')}>
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
