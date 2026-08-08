'use client'

import { Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import SiteFooter from '@/components/shared/SiteFooter'
import { Button } from '@/components/ui/button'
import { HOME_SHELL } from '@/components/listings/ListingRow'

function BookingSentContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? 'Talangen'

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader currentMode="planner" />

      <div className={`${HOME_SHELL} flex-1 flex flex-col justify-center py-12 md:py-20`}>
        <div className="mx-auto w-full max-w-lg">
          <div
            className="bg-white p-6 sm:p-8"
            style={{
              borderRadius: 12,
              border: '1px solid rgba(221,221,221,1)',
              boxShadow: 'rgba(0, 0, 0, 0.08) 0px 6px 16px',
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D9E75]/15 mb-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="text-[#1D9E75]"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight">
              Förfrågan skickad!
            </h1>
            <p className="mt-3 text-[16px] leading-[1.5] text-[#6a6a6a]">
              <span className="font-medium text-[#222222]">{provider}</span> har fått din
              förfrågan och återkommer så snart som möjligt. Du får ett mejl när de svarar.
            </p>

            <ul className="mt-6 space-y-3 border-t border-[#ebebeb] pt-6">
              <NextStep>
                Följ statusen under{' '}
                <Link href="/planner/bookings" className="font-medium text-[#222222] underline underline-offset-2">
                  Dina bokningar
                </Link>
              </NextStep>
              <NextStep>När de accepterar kan ni chatta och spika detaljerna</NextStep>
              <NextStep>Du debiteras ingenting förrän ni kommit överens</NextStep>
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <Button asChild size="lg" className="w-full rounded-xl text-base font-semibold">
                <Link href="/planner/bookings">Se dina bokningar</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-xl text-base font-semibold border-[#222222] text-[#222222]"
              >
                <Link href="/">Hitta fler talanger</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full rounded-xl text-base font-semibold text-[#222222]"
              >
                <Link href="/planner/shortlist">Min sparade lista</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter isLoggedIn />
    </main>
  )
}

function NextStep({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-[1.45] text-[#6a6a6a]">
      <span
        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF2E8A]"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  )
}

export default function BookingSentPage() {
  return (
    <Suspense>
      <BookingSentContent />
    </Suspense>
  )
}
