'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function BookingSentContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? 'Talangen'

  return (
    <main className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-10 text-center mb-4">
          <p className="text-5xl mb-5">🎉</p>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3">
            Förfrågan skickad!
          </h1>
          <p className="text-sm text-[#717171] leading-relaxed">
            <span className="font-semibold text-[#1A1A2E]">{provider}</span> har fått din förfrågan och återkommer så snart som möjligt. Du får ett mejl när de svarar.
          </p>
        </div>

        <div className="space-y-2">
          <Link
            href="/planner/bookings"
            className="flex items-center justify-between rounded-2xl bg-[#FF6B35] px-5 py-4 hover:bg-[#e55a26] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-sm font-semibold text-white">Se dina bokningar</span>
            </div>
            <span className="text-white text-sm">→</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between rounded-2xl bg-white border border-[#EBEBEB] px-5 py-4 hover:bg-[#F7F7F7] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="text-sm font-medium text-[#1A1A2E]">Hitta fler talanger</span>
            </div>
            <span className="text-[#FF6B35] text-sm">→</span>
          </Link>

          <Link
            href="/planner/shortlist"
            className="flex items-center justify-between rounded-2xl bg-white border border-[#EBEBEB] px-5 py-4 hover:bg-[#F7F7F7] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="text-sm font-medium text-[#1A1A2E]">Min sparade lista</span>
            </div>
            <span className="text-[#FF6B35] text-sm">→</span>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function BookingSentPage() {
  return (
    <Suspense>
      <BookingSentContent />
    </Suspense>
  )
}
