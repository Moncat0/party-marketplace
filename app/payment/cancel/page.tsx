import Link from 'next/link'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        <SettingsSection title="Betalning avbruten">
          <div
            className="mx-auto mb-5 h-14 w-14 flex items-center justify-center"
            style={{
              borderRadius: t.rounded.full,
              backgroundColor: t.colors.surfaceStrong,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={t.colors.muted}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a] text-center">
            Ingen betalning har genomförts. Din bokning är fortfarande bekräftad — du kan betala när
            du är redo.
          </p>
        </SettingsSection>

        <Link href="/planner/bookings" className="block">
          <SettingsButton className="w-full">Tillbaka till bokningar</SettingsButton>
        </Link>
      </div>
    </main>
  )
}
