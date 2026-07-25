'use client'

import Link from 'next/link'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-6xl mb-6">😬</p>
        <h1 className="text-2xl font-bold text-[#222222] mb-2">Något gick fel</h1>
        <p className="text-sm text-[#6A6A6A] mb-8">
          Ett oväntat fel inträffade. Försök igen eller gå tillbaka till startsidan.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl border border-[#DDDDDD] bg-white px-5 py-3 text-sm font-medium text-[#222222] hover:bg-[#F2F2F2] transition-colors"
          >
            Försök igen
          </button>
          <Link
            href="/"
            className="rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
          >
            Startsidan
          </Link>
        </div>
      </div>
    </main>
  )
}
