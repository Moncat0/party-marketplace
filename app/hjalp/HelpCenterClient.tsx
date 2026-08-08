'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  HELP_ARTICLES,
  HELP_EXPLORE,
  HELP_GUIDES,
  articlesForRole,
  type HelpRole,
} from '@/lib/help'
import BrandLogo from '@/components/shared/BrandLogo'
import { cn } from '@/lib/utils'

/**
 * Airbnb Help Center layout for Festly.
 * Structure audited from airbnb.com/help (Jul 2026):
 * hero + search → role tabs → login card → guides → top articles → explore → contact
 */
export default function HelpCenterClient() {
  const [role, setRole] = useState<HelpRole>('planner')
  const [query, setQuery] = useState('')

  const articles = useMemo(() => {
    const base = articlesForRole(role)
    const q = query.trim().toLowerCase()
    if (!q) return base.slice(0, 6)
    return HELP_ARTICLES.filter(
      a =>
        (a.role === role || a.role === 'both') &&
        (a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.body.some(p => p.toLowerCase().includes(q)))
    )
  }, [role, query])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1120px] px-6 pb-24 pt-10 sm:px-10 sm:pt-14">
        {/* Hero */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-[32px] font-semibold leading-9 tracking-[-0.04em] text-[#222222] sm:text-[40px] sm:leading-[44px]">
            Hej, hur kan vi hjälpa dig?
          </h1>

          <div className="relative mt-6 max-w-[720px]">
            <svg
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#222222]"
              width="18"
              height="18"
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
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök efter artiklar…"
              aria-label="Sök i hjälpcentret"
              className="h-16 w-full rounded-full border border-[#DDDDDD] bg-background pl-14 pr-6 text-[16px] text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] placeholder:text-[#6A6A6A] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
            />
          </div>

          {/* Role tabs — Airbnb Guest / Service host → Planerare / Talang */}
          <div
            className="mt-6 flex gap-6 overflow-x-auto border-b border-[#DDDDDD]"
            role="tablist"
            aria-label="Välj roll"
          >
            {(
              [
                { id: 'planner' as const, label: 'Planerare' },
                { id: 'provider' as const, label: 'Talang' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={role === tab.id}
                onClick={() => setRole(tab.id)}
                className={cn(
                  'relative shrink-0 pb-3 text-[14px] font-medium transition-colors',
                  role === tab.id ? 'text-[#222222]' : 'text-[#6A6A6A] hover:text-[#222222]'
                )}
              >
                {tab.label}
                {role === tab.id && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#222222]" />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* We’re here for you */}
        <section className="mb-12 flex flex-col gap-4 rounded-2xl border border-[#DDDDDD] bg-[#F7F7F7] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#222222]">
              Vi finns här för dig
            </h2>
            <p className="mt-2 text-[14px] leading-5 text-[#6A6A6A]">
              Logga in för hjälp med bokningar, konto och mer.
            </p>
          </div>
          <Button
            asChild
            variant="dark"
            className="h-12 shrink-0 rounded-lg px-6 text-[16px] font-medium"
          >
            <Link href="/signup?intent=planner&next=/hjalp">Logga in eller skapa konto</Link>
          </Button>
        </section>

        {/* Guides */}
        {!query.trim() && (
          <section className="mb-14">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#222222]">
                Guider för att komma igång
              </h2>
              <Link
                href={role === 'planner' ? '/sa-funkar-det' : '/for-talanger'}
                className="text-[14px] font-semibold text-[#222222] underline-offset-2 hover:underline"
              >
                Bläddra alla ämnen
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              {HELP_GUIDES.map(guide => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group overflow-hidden rounded-2xl border border-[#DDDDDD] bg-background transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <div
                    className={cn(
                      'flex h-[160px] items-end bg-gradient-to-br p-6 sm:h-[180px]',
                      guide.accent
                    )}
                  >
                    <span className="opacity-90">
                      <BrandLogo href={null} height={28} />
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[16px] font-semibold text-[#222222] group-hover:underline">
                      {guide.title}
                    </h3>
                    <p className="mt-1 text-[14px] leading-5 text-[#6A6A6A]">{guide.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top articles */}
        <section className="mb-14">
          <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.02em] text-[#222222]">
            {query.trim() ? 'Sökresultat' : 'Populära artiklar'}
          </h2>
          {articles.length === 0 ? (
            <p className="text-[14px] text-[#6A6A6A]">
              Inga artiklar matchade. Prova ett annat sökord eller byt flik.
            </p>
          ) : (
            <ul className="divide-y divide-[#DDDDDD] border-t border-[#DDDDDD]">
              {articles.map(article => (
                <li key={article.slug}>
                  <Link
                    href={`/hjalp/${article.slug}`}
                    className="block py-5 transition-colors hover:bg-[#F7F7F7]/50 sm:px-1"
                  >
                    <h3 className="text-[16px] font-semibold text-[#222222]">{article.title}</h3>
                    <p className="mt-1 text-[14px] leading-5 text-[#6A6A6A]">{article.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Explore more */}
        {!query.trim() && (
          <section className="mb-14">
            <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.02em] text-[#222222]">
              Utforska mer
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {HELP_EXPLORE.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-[#DDDDDD] p-6 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <h3 className="text-[16px] font-semibold text-[#222222]">{item.title}</h3>
                  <p className="mt-1 text-[14px] leading-5 text-[#6A6A6A]">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="rounded-2xl border border-[#DDDDDD] p-6 sm:p-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#222222]">
            Behöver du komma i kontakt?
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-5 text-[#6A6A6A]">
            Vi börjar med några frågor och ser till att du hamnar rätt. Du kan också ge oss feedback.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="dark" className="h-12 rounded-lg px-6 text-[16px] font-medium">
              <Link href="/signup?intent=planner&next=/planner/messages">Kontakta oss</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg border-[#222222] px-6 text-[16px] font-medium shadow-none"
            >
              <Link href="/signup?intent=planner">Ge feedback</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
