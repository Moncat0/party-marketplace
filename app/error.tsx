'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
          <Button type="button" variant="outline" onClick={reset} className="rounded-xl">
            Försök igen
          </Button>
          <Link
            href="/"
            className="rounded-xl bg-[#FF2E8A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#E01F74] transition-colors"
          >
            Startsidan
          </Link>
        </div>
      </div>
    </main>
  )
}
