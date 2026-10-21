import Image from 'next/image'
import Link from 'next/link'
import JoinScrollHeader from '@/components/marketing/join/JoinScrollHeader'
import ScrollReveal from '@/components/marketing/supply/ScrollReveal'
import SupplyCtaButton from '@/components/marketing/supply/SupplyCtaButton'
import SupplyHeroPhotos from '@/components/marketing/supply/SupplyHeroPhotos'
import { SUPPLY_FAQS } from '@/components/marketing/supply/content'
import { CATEGORIES } from '@/lib/categories'
import SiteFooter from '@/components/shared/SiteFooter'
import '@/components/marketing/supply/supply-landing.css'

const PAYMENTS_LIVE = false

const HERO_WORDS_LINE1 = ['GÖR', 'DET', 'DU ÄLSKAR.']
const HERO_WORDS_LINE2 = ['FÅ', 'BETALT', 'FÖR DET.']

const WHY_CARDS = [
  {
    title: 'Vi hjälper dig att få jobb',
    description:
      'Vi marknadsför dig mot folk som redan söker din typ av tjänst. Du slipper knacka dörr.',
    icon: 'leads' as const,
  },
  {
    title: 'Få betalt, varje gång',
    description:
      'Betalning och faktura sköter sig via appen. Du fakturerar inte, du jobbar.',
    icon: 'payment' as const,
  },
  {
    title: 'Dina priser, dina villkor',
    description:
      'Du sätter ditt pris, dina villkor och din tillgänglighet. Gigtorget tar inga jobb du inte vill ha.',
    icon: 'control' as const,
  },
] as const

const BASE_STEPS = [
  {
    n: 1,
    badge: 'STEG 1',
    title: 'Bygg din sida',
    description:
      'Lägg till bilder av ditt arbete, beskriv dina tjänster och sätt dina priser. Det tar under tio minuter.',
    file: 'profile.webp',
  },
  {
    n: 2,
    badge: 'STEG 2',
    title: 'Ta emot förfrågningar',
    description:
      'Kunder skickar förfrågningar direkt till dig. Du väljer själv vilka du svarar på — inget krångel.',
    file: 'requests.webp',
  },
  {
    n: 3,
    badge: 'STEG 3',
    title: 'Skicka en offert',
    description:
      'Svara i chatten och skicka ett pris direkt — inget krångel med separata mejl.',
    file: 'chat-offer.webp',
  },
]

const STEP_4 = {
  n: 4,
  badge: 'STEG 4',
  title: 'Bli bokad',
  description:
    'Kunden bekräftar din offert och bokningen är klar. Pengarna betalas ut när jobbet är utfört.',
  file: 'booking-paid.webp',
}

const JOIN_STEPS = PAYMENTS_LIVE ? [...BASE_STEPS, STEP_4] : BASE_STEPS

const BONUSES = [
  {
    title: 'Recensioner som syns',
    description:
      'Varje bokning kan ge ett omdöme. Din sida blir bättre med varje jobb.',
  },
  {
    title: 'En länk att dela överallt',
    description:
      'Lägg din Gigtorget-sida i Instagram-bion, i offerter eller i en DM.',
  },
  {
    title: 'Du väljer själv',
    description:
      'Inga minimiuppdrag, inga tvingade priser. Acceptera det som passar dig.',
  },
] as const

function WhyIcon({ kind }: { kind: (typeof WHY_CARDS)[number]['icon'] }) {
  const base = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#111111',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  if (kind === 'leads') {
    return (
      <svg {...base}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M2 20c0-3.3 2.7-6 6-6h4" />
        <path d="M18 14l3 3-3 3" />
        <path d="M21 17h-7" />
      </svg>
    )
  }
  if (kind === 'payment') {
    return (
      <svg {...base}>
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    )
  }
  return (
    <svg {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="6" r="2" fill="#111111" stroke="none" />
      <circle cx="16" cy="12" r="2" fill="#111111" stroke="none" />
      <circle cx="10" cy="18" r="2" fill="#111111" stroke="none" />
    </svg>
  )
}

const STEP_IMAGES: Record<string, boolean> = {
  'profile.webp': true,
  'requests.webp': true,
  'chat-offer.webp': true,
}

function StepImage({ file, alt }: { file: string; alt: string }) {
  if (STEP_IMAGES[file]) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[#e8ddce] shadow-[var(--shadow-soft-sm)]">
        <Image
          src={`/images/join/${file}`}
          alt={alt}
          width={600}
          height={500}
          className="w-full object-cover object-top"
        />
      </div>
    )
  }
  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-xl)] bg-[#f0f0f0]">
      <p className="supply-body text-sm text-[var(--ink-300)]">{file}</p>
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
  return (
    <div className="min-h-screen">
      <JoinScrollHeader />

      <div className="supply-shell">
        {/* ── Hero ── */}
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
              Skapa din sida och bli hittad av folk som redan letar efter dig. Helt gratis.
            </p>
            <div
              style={{
                animation: 'supplyHeroWord 600ms var(--ease-standard) both',
                animationDelay: '600ms',
              }}
            >
              <SupplyCtaButton />
              <p className="supply-body mt-3 text-[14px] text-[var(--ink-300)]">
                Gratis · Tar under 10 minuter
              </p>
            </div>
          </div>
          <SupplyHeroPhotos />
        </section>
      </div>

      {/* ── Founding talent band ── */}
      <div className="bg-[#111111] py-3 text-center">
        <p className="supply-body text-[13px] font-medium text-white/80">
          Vi lanserar 9 november.{' '}
          <span className="font-semibold text-white">
            Bli en av de första på Gigtorget.
          </span>
        </p>
      </div>

      <div className="supply-shell">
        {/* ── Varfor Gigtorget ── */}
        <ScrollReveal className="pb-20 pt-16">
          <h2 className="supply-display fs-display-md mb-7 text-center text-[var(--ink-900)]">
            Varför Gigtorget?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WHY_CARDS.map(card => (
              <div
                key={card.title}
                className="rounded-[var(--radius-lg)] border border-[#e8ddce] bg-white px-6 py-7"
              >
                <div className="mb-5">
                  <WhyIcon kind={card.icon} />
                </div>
                <h3 className="supply-body fs-h3 mb-2 font-bold text-[var(--ink-900)]">
                  {card.title}
                </h3>
                <p className="supply-body fs-body-sm m-0 text-[var(--ink-500)]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ── Sa funkar det ── */}
        <ScrollReveal className="pb-20">
          <h2 className="supply-display fs-display-md mb-7 text-center text-[var(--ink-900)]">
            Så funkar det
          </h2>
          <div className="flex flex-col gap-16 lg:gap-20">
            {JOIN_STEPS.map((step, i) => {
              const swap = i % 2 === 1
              return (
                <div
                  key={step.badge}
                  className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
                >
                  <div className={swap ? 'lg:order-2' : ''}>
                    <span className="supply-badge">{step.badge}</span>
                    <h3 className="supply-display supply-display-plain fs-h1 mb-3 mt-4 text-[var(--ink-900)]">
                      {step.title}
                    </h3>
                    <p className="supply-body fs-body-lg m-0 text-[var(--ink-500)]">
                      {step.description}
                    </p>
                  </div>
                  <div className={swap ? 'lg:order-1' : ''}>
                    <StepImage file={step.file} alt={step.title} />
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal className="pb-10 text-center">
          <SupplyCtaButton />
        </ScrollReveal>

        {/* ── Dessutom ── */}
        <ScrollReveal className="pb-20">
          <h2 className="supply-display fs-h1 mb-7 text-center text-[var(--ink-900)]">
            Dessutom
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {BONUSES.map(b => (
              <div key={b.title} className="flex gap-4">
                <div className="mt-0.5 shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#111111"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="supply-body fs-body font-bold text-[var(--ink-900)] mb-1">
                    {b.title}
                  </p>
                  <p className="supply-body fs-body-sm m-0 text-[var(--ink-500)]">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ── Categories ── */}
        <ScrollReveal className="mb-14 rounded-[var(--radius-xl)] border border-[#e8ddce] bg-white px-6 py-14 text-center sm:px-10">
          <h2 className="supply-display fs-h1 mb-2 text-[var(--ink-900)]">
            Oavsett vad du erbjuder
          </h2>
          <p className="supply-body fs-body mb-8 text-[var(--ink-500)]">
            Gigtorget är öppet för alla typer av fest- och eventtjänster.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/sok?category=${cat.slug}`}
                className="supply-body fs-body-sm inline-flex h-10 items-center rounded-[var(--radius-pill)] border border-[#e8ddce] bg-white px-4 font-semibold text-[var(--ink-900)] shadow-[var(--shadow-soft-sm)] transition-colors hover:border-[var(--pink-500)]"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* ── FAQ ── */}
        <ScrollReveal className="mx-auto max-w-[760px] pb-20">
          <h2 className="supply-display fs-display-md mb-10 text-center text-[var(--ink-900)]">
            Vanliga frågor
          </h2>
          <div className="flex flex-col gap-3.5">
            {SUPPLY_FAQS.map(faq => (
              <details key={faq.q} className="supply-faq px-[22px] py-[18px]">
                <summary className="supply-body fs-body-lg flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-[var(--ink-900)]">
                  {faq.q}
                  <span
                    className="supply-faq-chevron supply-display supply-display-plain shrink-0 text-[28px] leading-none text-[var(--ink-900)] transition-transform duration-150"
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

        {/* ── Final CTA ── */}
        <ScrollReveal className="mb-14 mt-6 rounded-[var(--radius-xl)] bg-[#111111] px-6 py-14 sm:px-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="supply-display fs-display-md mb-2 text-white">Redo att börja?</h2>
              <p className="supply-body fs-body-lg m-0 text-white/65">
                Skapa din sida gratis — det tar mindre än 10 minuter.
              </p>
            </div>
            <SupplyCtaButton label="Skapa din sida — gratis" className="shrink-0" />
          </div>
        </ScrollReveal>
      </div>

      <SiteFooter />
    </div>
  )
}
