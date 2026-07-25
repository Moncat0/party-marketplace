'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsButton from '@/components/settings/SettingsButton'

function BookingSentContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? 'Talangen'

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        <SettingsSection title="Förfrågan skickad!">
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a]">
            <span className="font-medium text-[#222222]">{provider}</span> har fått din förfrågan
            och återkommer så snart som möjligt. Du får ett mejl när de svarar.
          </p>
        </SettingsSection>

        <div className="space-y-3">
          <Link href="/planner/bookings" className="block">
            <SettingsButton className="w-full">Se dina bokningar</SettingsButton>
          </Link>
          <Link href="/" className="block">
            <SettingsButton variant="secondary" className="w-full">
              Hitta fler talanger
            </SettingsButton>
          </Link>
          <Link href="/planner/shortlist" className="block">
            <SettingsButton variant="secondary" className="w-full">
              Min sparade lista
            </SettingsButton>
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
