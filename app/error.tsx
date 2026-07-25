'use client'

import Link from 'next/link'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-6xl mb-6">😬</p>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Något gick fel</h1>
        <p className="text-sm text-[#5F5E5A] mb-8">
          Ett oväntat fel inträffade. Försök igen eller gå tillbaka till startsidan.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl border border-[#E8E3DC] bg-white px-5 py-3 text-sm font-medium text-[#1A1A2E] hover:bg-[#F0EDE8] transition-colors"
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
