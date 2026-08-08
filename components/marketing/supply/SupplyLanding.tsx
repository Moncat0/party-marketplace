'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import BrowseSearch from '@/components/navbar/BrowseSearch'
import ScrollReveal from '@/components/marketing/supply/ScrollReveal'
import SupplyCtaButton from '@/components/marketing/supply/SupplyCtaButton'
import SupplyHeroPhotos from '@/components/marketing/supply/SupplyHeroPhotos'
import {
  SUPPLY_BENEFITS,
  SUPPLY_CATEGORY_LABELS,
  SUPPLY_FAQS,
  SUPPLY_FEATURES,
  SUPPLY_STEPS,
} from '@/components/marketing/supply/content'
import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'
import '@/components/marketing/supply/supply-landing.css'

const HERO_WORDS_LINE1 = ['GÖR', 'DET', 'DU', 'ÄLSKAR.']
const HERO_WORDS_LINE2 = ['FÅ', 'BETALT', 'FÖR', 'DET.']

function BenefitIcon({ kind }: { kind: (typeof SUPPLY_BENEFITS)[number]['icon'] }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#111',
    strokeWidth: 2,
    'aria-hidden': true as const,
  }
  switch (kind) {
    case 'portfolio':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 15l-5-5-9 9" />
        </svg>
      )
    case 'star':
      return (
        <svg {...props}>
          <path d="M12 3l2.6 6.2L21 10l-5 4.4L17.4 21 12 17.3 6.6 21 8 14.4 3 10l6.4-.8z" />
        </svg>
      )
    case 'link':
      return (
        <svg {...props}>
          <path d="M9 12a4 4 0 004 4h1a4 4 0 000-8h-1" />
          <path d="M15 12a4 4 0 00-4-4H10a4 4 0 000 8h1" />
        </svg>
      )
    case 'free':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

function StepMock({ kind }: { kind: (typeof SUPPLY_STEPS)[number]['mock'] }) {
  if (kind === 'profile') {
    return (
      <div className="h-full rounded-[var(--radius-md)] bg-white p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="mb-3.5 h-14 rounded-[var(--radius-sm)] bg-[var(--pink-50)]" />
        <p className="supply-body m-0 text-[15px] font-bold text-[var(--ink-900)]">Elin Lund</p>
        <p className="mb-2.5 mt-0.5 text-xs text-[var(--ink-500)]">DJ · Stockholm</p>
        <div className="mb-1.5 h-1.5 w-[90%] rounded-full bg-[var(--border-subtle)]" />
        <div className="h-1.5 w-[70%] rounded-full bg-[var(--border-subtle)]" />
      </div>
    )
  }
  if (kind === 'requests') {
    return (
      <div className="flex h-full flex-col gap-2 rounded-[var(--radius-md)] bg-white p-3.5 shadow-[var(--shadow-soft-sm)]">
        {[
          { title: 'Födelsedag', date: 'Lör 14 sep', tone: 'bg-[var(--pink-100)]' },
          { title: 'Bröllop', date: 'Lör 21 sep', tone: 'bg-[var(--orange-100)]' },
          { title: 'Företagsfest', date: 'Fre 4 okt', tone: 'bg-[var(--pink-100)]' },
        ].map(row => (
          <div
            key={row.title}
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-[var(--cream-50)] px-2 py-2"
          >
            <div className={cn('h-[26px] w-[26px] shrink-0 rounded-full', row.tone)} />
            <div>
              <p className="supply-body m-0 text-xs font-bold text-[var(--ink-900)]">{row.title}</p>
              <p className="m-0 text-[11px] text-[var(--ink-500)]">{row.date}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'offer') {
    return (
      <div className="flex h-full flex-col gap-2 rounded-[var(--radius-md)] bg-white p-4 shadow-[var(--shadow-soft-sm)]">
        <p className="supply-body m-0 text-[13px] font-bold text-[var(--ink-900)]">Hej Sara,</p>
        <div className="h-1.5 w-[95%] rounded-full bg-[var(--border-subtle)]" />
        <div className="h-1.5 w-4/5 rounded-full bg-[var(--border-subtle)]" />
        <div className="mt-1 flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--pink-50)] px-2.5 py-2">
          <span className="text-xs text-[var(--ink-700)]">Offert</span>
          <span className="supply-display supply-display-plain text-[14px] leading-none text-[var(--ink-900)]">
            3 500 kr
          </span>
        </div>
        <div className="mt-auto rounded-[var(--radius-sm)] bg-[var(--ink-900)] py-2 text-center">
          <span className="supply-body text-xs font-bold text-white">Skicka</span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] bg-white p-4 shadow-[var(--shadow-soft-sm)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--orange-100)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-600)" strokeWidth="2.5" aria-hidden>
          <path d="M4 12l5 5L20 6" />
        </svg>
      </div>
      <p className="supply-display supply-display-plain fs-h3 m-0 text-[var(--ink-900)]">
        3 500 kr
      </p>
      <p className="m-0 text-xs text-[var(--ink-500)]">Betalning mottagen</p>
    </div>
  )
}

function FeatureSlot({
  placeholder,
  className,
}: {
  placeholder: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--cream-100)] px-6 text-center',
        className
      )}
    >
      <p className="supply-body max-w-xs text-[13px] leading-relaxed text-[var(--ink-500)]">{placeholder}</p>
    </div>
  )
}

function HeroWord({ word, delayMs }: { word: string; delayMs: number }) {
  return (
    <span
      className="supply-hero-word"
      style={{
        animation: 'supplyHeroWord 600ms var(--ease-standard) both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      {word}
    </span>
  )
}

export default function SupplyLanding() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [locationId, setLocationId] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(prev => {
          if (!prev && y > 24) return true
          if (prev && y < 8) return false
          return prev
        })
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen">
      <MarketplaceHeader
        className="supply-header"
        scrolled={scrolled}
        currentMode="planner"
        center={
          <BrowseSearch
            query={query}
            onQueryChange={setQuery}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            locationId={locationId}
            onLocationChange={setLocationId}
            scrolled={scrolled}
            maxWidth={480}
            emptyLocationLabel="Var ska festen vara?"
            emptyServiceLabel="Vilken tjänst söker du?"
          />
        }
      />

      <div className="supply-shell">
        {/* Hero — gap 56px; extra top pad so pink photo offset clears the nav */}
        <section className="grid items-center gap-10 pb-[88px] pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pt-14">
          <div>
            <span className="supply-badge">För dig som jobbar med fest och event</span>
            <h1 className="supply-hero-title my-5 mb-6 text-[var(--ink-900)]">
              <span className="flex flex-wrap gap-x-[0.35em]">
                {HERO_WORDS_LINE1.map((w, i) => (
                  <HeroWord key={w} word={w} delayMs={i * 70} />
                ))}
              </span>
              <span className="flex flex-wrap gap-x-[0.35em]">
                {HERO_WORDS_LINE2.map((w, i) => (
                  <HeroWord key={w} word={w} delayMs={300 + i * 70} />
                ))}
              </span>
            </h1>
            <p className="supply-body fs-body-lg mb-8 max-w-[480px] text-[var(--ink-700)]">
              Skapa din sida och bli hittad av arrangörer som redan letar efter dig. Helt gratis.
            </p>
            <div
              className="flex flex-wrap items-center gap-5"
              style={{
                animation: 'supplyHeroWord 600ms var(--ease-standard) both',
                animationDelay: '600ms',
              }}
            >
              <SupplyCtaButton />
              <span className="supply-hand inline-flex items-center gap-1.5 text-[var(--ink-900)] -rotate-[3deg]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                Tar under 10 minuter
              </span>
            </div>
          </div>
          <SupplyHeroPhotos />
        </section>

        {/* Benefits — padding 64px 0; title mb 48; gap 24; card pad 28×22 */}
        <ScrollReveal className="py-16">
          <h2 className="supply-display fs-display-md mb-12 text-center text-[var(--ink-900)]">
            Varför Festly?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPLY_BENEFITS.map((b, i) => (
              <div key={b.title} className="supply-card px-[22px] py-7">
                <div
                  className={cn(
                    'mb-[18px] flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]',
                    i % 2 === 0 ? 'bg-[var(--pink-50)]' : 'bg-[var(--orange-50)]'
                  )}
                >
                  <BenefitIcon kind={b.icon} />
                </div>
                <h3 className="supply-body fs-h3 mb-2 font-bold text-[var(--ink-900)]">{b.title}</h3>
                <p className="supply-body fs-body-sm m-0 text-[var(--ink-500)]">{b.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* How it works — padding 72px 0; gap 24 */}
        <ScrollReveal className="py-[72px]">
          <div className="mb-12 text-center">
            <h2 className="supply-display fs-display-md m-0 text-[var(--ink-900)]">Så funkar det</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPLY_STEPS.map(step => (
              <div key={step.badge}>
                <div className="mb-5 rounded-[var(--radius-lg)] bg-[var(--cream-50)] p-4">
                  <div className="h-40">
                    <StepMock kind={step.mock} />
                  </div>
                </div>
                <span className="supply-badge">{step.badge}</span>
                <h3 className="supply-body fs-h3 mb-2 mt-3.5 font-bold text-[var(--ink-900)]">
                  {step.title}
                </h3>
                <p className="supply-body fs-body-sm-relaxed m-0 text-[var(--ink-500)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="pb-6 text-center">
          <SupplyCtaButton />
        </ScrollReveal>

        {/* Features — padding 72px 0; gap 32; large slot 480; small 224 */}
        <ScrollReveal className="py-[72px]">
          <div className="mb-12 text-center">
            <h2 className="supply-display fs-display-md m-0 text-[var(--ink-900)]">Allt du behöver</h2>
            <p className="supply-body fs-body-lg mt-3 text-[var(--ink-500)]">
              Från första bilden till betald bokning.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <FeatureSlot
                placeholder={SUPPLY_FEATURES[0].placeholder}
                className="h-[280px] lg:h-[480px]"
              />
              <div className="mt-6">
                <span className="supply-badge">{SUPPLY_FEATURES[0].badge}</span>
                <h3 className="supply-display supply-display-plain fs-h1 mb-2.5 mt-4 text-[var(--ink-900)]">
                  {SUPPLY_FEATURES[0].title}
                </h3>
                <p className="supply-body fs-body-lg m-0 text-[var(--ink-500)]">
                  {SUPPLY_FEATURES[0].description}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-8">
              {SUPPLY_FEATURES.slice(1).map(feat => (
                <div key={feat.badge}>
                  <FeatureSlot placeholder={feat.placeholder} className="h-[224px]" />
                  <div className="mt-5">
                    <span
                      className={cn(
                        'supply-badge',
                        feat.badge.includes('KOMMUNIKATION') && 'supply-badge-orange'
                      )}
                    >
                      {feat.badge}
                    </span>
                    <h3 className="supply-display supply-display-plain fs-h2 mb-2 mt-3.5 text-[var(--ink-900)]">
                      {feat.title}
                    </h3>
                    <p className="supply-body fs-body m-0 text-[var(--ink-500)]">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="pb-6 text-center">
          <SupplyCtaButton />
        </ScrollReveal>

        {/* Categories — padding 56×40; margin 56 0; tags gap 14 */}
        <ScrollReveal className="my-14 rounded-[var(--radius-xl)] bg-[var(--cream-50)] px-6 py-14 text-center sm:px-10">
          <h2 className="supply-display fs-h1 mb-2 text-[var(--ink-900)]">Oavsett vad du erbjuder</h2>
          <p className="supply-body fs-body mb-8 text-[var(--ink-500)]">
            Festly är öppet för alla typer av fest- och eventtjänster.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/sok?category=${cat.slug}`}
                className="supply-body fs-body-sm inline-flex h-10 items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-white px-4 font-semibold text-[var(--ink-900)] shadow-[var(--shadow-soft-sm)] transition-colors hover:border-[var(--pink-500)]"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* FAQ — padding 64; max 760; title mb 40; items gap 14 */}
        <ScrollReveal className="mx-auto max-w-[760px] py-16">
          <h2 className="supply-display fs-display-md mb-10 text-center text-[var(--ink-900)]">
            Vanliga frågor
          </h2>
          <div className="flex flex-col gap-3.5">
            {SUPPLY_FAQS.map(faq => (
              <details key={faq.q} className="supply-faq px-[22px] py-[18px]">
                <summary className="supply-body fs-body-lg flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-[var(--ink-900)]">
                  {faq.q}
                  <span
                    className="supply-faq-chevron supply-display supply-display-plain shrink-0 text-[22px] leading-none text-[var(--pink-500)] transition-transform duration-150"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="supply-body fs-body mt-3.5 text-[var(--ink-500)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>

        {/* Final CTA — margin 24 0 56; padding 56 48 */}
        <ScrollReveal className="mb-14 mt-6 rounded-[var(--radius-xl)] bg-[var(--ink-900)] px-6 py-14 sm:px-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="supply-display fs-display-md mb-2 text-white">Redo att börja?</h2>
              <p className="supply-body fs-body-lg m-0 text-white/65">
                Skapa din annons gratis – det tar mindre än 10 minuter.
              </p>
            </div>
            <SupplyCtaButton label="Skapa din annons – gratis" className="shrink-0" />
          </div>
        </ScrollReveal>
      </div>

      <footer className="bg-[var(--ink-900)]">
        <div className="supply-shell pb-8 pt-14">
          <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Image
                src="/images/supply/festly-wordmark.svg"
                alt="Festly"
                width={140}
                height={28}
                className="mb-3.5 h-7 w-auto brightness-0 invert"
              />
              <p className="supply-body fs-body-sm m-0 max-w-[320px] text-white/60">
                Festly kopplar ihop dig med de bästa leverantörerna och lokalerna. Så att du kan
                fokusera på det som betyder något.
              </p>
            </div>
            <div>
              <p className="supply-body fs-caption mb-4 font-bold uppercase tracking-[1.5px] text-white/40">
                Kategorier
              </p>
              <div className="flex flex-col gap-3">
                {SUPPLY_CATEGORY_LABELS.map((label, i) => (
                  <Link
                    key={label}
                    href={`/sok?category=${CATEGORIES[i]?.slug ?? ''}`}
                    className="supply-body fs-body-sm text-white/65 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="supply-body fs-caption mb-4 font-bold uppercase tracking-[1.5px] text-white/40">
                Info
              </p>
              <div className="flex flex-col gap-3">
                <FooterLink href="/sa-funkar-det">Så funkar det</FooterLink>
                <FooterLink href="/hjalp">Hjälpcenter</FooterLink>
                <FooterLink href="/privacy">Integritetspolicy</FooterLink>
                <FooterLink href="/terms">Användarvillkor</FooterLink>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2.5 border-t border-white/10 pt-5">
            <p className="supply-body fs-caption m-0 text-white/30">
              © {new Date().getFullYear()} Festly Stockholm
            </p>
            <p className="supply-body fs-caption m-0 text-white/30">Gjord för fest och kalas</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="supply-body fs-body-sm text-white/65 transition-colors hover:text-white">
      {children}
    </Link>
  )
}
