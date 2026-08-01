import Link from 'next/link'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        <SettingsSection title="Betalning mottagen!">
          <div
            className="mx-auto mb-5 h-14 w-14 flex items-center justify-center"
            style={{
              borderRadius: t.rounded.full,
              backgroundColor: 'rgba(29, 158, 117, 0.1)',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={t.colors.success}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a] text-center">
            Tack! Beloppet hålls säkert av FESTEN tills evenemanget är genomfört och du godkänner
            utbetalning till talangen. Du får ett kvitto från FESTEN på e-post när betalningen är
            bekräftad.
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
        </div>
      </div>
    </main>
  )
}
