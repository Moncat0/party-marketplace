'use client'

import { useState, useEffect, useMemo, useRef, Children, isValidElement, type ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  href?: string
  children: ReactNode
}

/**
 * Live Airbnb explore shell (audited from airbnb.com CSS, Jul 2026):
 * --explore_max-width: 1344px (1824px @ 1920+)
 * --explore_padding-inline: 16 → 24 → 32 → 48
 * --contentscroller_gap: 12px
 * --contentscroller_visible-items / --peek_*: 2 → 4 → 5 → 6 → 7
 */
export const HOME_SHELL =
  'mx-auto w-full max-w-[1344px] min-[1920px]:max-w-[1824px] px-4 min-[375px]:px-6 min-[950px]:px-8 min-[1440px]:px-12'

/**
 * Airbnb Services search results shell — live audit Jul 2026:
 * --explore_max-width: 1920px
 * --explore_padding-inline: 24px (32px at larger breakpoints)
 */
export const RESULTS_SHELL =
  'mx-auto w-full max-w-[1920px] px-4 min-[375px]:px-6 min-[744px]:px-8 min-[1128px]:px-10 min-[1440px]:px-12'

/** Airbnb --peek_* visible card counts by viewport. */
function columnsForViewport(w: number) {
  if (w >= 1440) return 7 // --peek_xl
  if (w >= 1128) return 6 // --peek_lg
  if (w >= 950) return 5 // --peek_mdp
  if (w >= 744) return 4 // --peek_md
  return 2 // --peek_sm
}

/**
 * Homepage listing row — arrow-paged content scroller matching live Airbnb.
 */
export default function ListingRow({ title, href, children }: Props) {
  const items = useMemo(() => Children.toArray(children), [children])
  const viewportRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(7)
  const [page, setPage] = useState(0)
  const [viewportW, setViewportW] = useState(0)

  useEffect(() => {
    function updateCols() {
      setCols(columnsForViewport(window.innerWidth))
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setViewportW(entry.contentRect.width)
    })
    ro.observe(el)
    setViewportW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const pageCount = Math.max(1, Math.ceil(items.length / cols))

  useEffect(() => {
    setPage(p => Math.min(p, pageCount - 1))
  }, [pageCount])

  const pages = useMemo(() => {
    const chunks: ReactNode[][] = []
    for (let i = 0; i < items.length; i += cols) {
      chunks.push(items.slice(i, i + cols))
    }
    return chunks.length > 0 ? chunks : [[]]
  }, [items, cols])

  const canPrev = page > 0
  const canNext = page < pageCount - 1
  const showArrows = pageCount > 1

  const heading = (
    <span className="inline-flex items-center gap-1 text-[22px] font-semibold tracking-[-0.44px] text-foreground">
      {title}
      {href && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5">
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )

  return (
    <section className="relative mb-10 md:mb-12">
      <div className={`${HOME_SHELL} flex items-center justify-between gap-4 mb-3`}>
        {href ? (
          <Link href={href} className="hover:underline underline-offset-2">
            {heading}
          </Link>
        ) : (
          <h2>{heading}</h2>
        )}

        {showArrows && (
          <div className="flex items-center gap-2">
            <ArrowBtn direction="prev" disabled={!canPrev} onClick={() => setPage(p => p - 1)} />
            <ArrowBtn direction="next" disabled={!canNext} onClick={() => setPage(p => p + 1)} />
          </div>
        )}
      </div>

      <div className={HOME_SHELL}>
        <div ref={viewportRef} className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: viewportW ? `translateX(-${page * viewportW}px)` : undefined,
            }}
          >
            {pages.map((pageItems, pageIndex) => (
              <div
                key={pageIndex}
                className="shrink-0 grid gap-3"
                style={{
                  width: viewportW || '100%',
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {pageItems.map((child, i) => (
                  <div
                    key={
                      isValidElement(child) && child.key != null
                        ? String(child.key)
                        : `idx-${i}`
                    }
                    className="min-w-0"
                  >
                    {child}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ArrowBtn({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={direction === 'prev' ? 'Föregående' : 'Nästa'}
      disabled={disabled}
      onClick={onClick}
      className="h-10 w-10 rounded-full border-border bg-background text-foreground shadow-none hover:scale-105 hover:bg-background disabled:opacity-30 disabled:hover:scale-100"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d={direction === 'prev' ? 'M7.5 2.5L4 6l3.5 3.5' : 'M4.5 2.5L8 6l-3.5 3.5'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Button>
  )
}
