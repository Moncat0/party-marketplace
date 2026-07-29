'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

/** Send a password-reset email; link opens /reset-password via /auth/callback. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError(null)

    const normalized = email.trim().toLowerCase()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : '/auth/callback?next=/reset-password'

    const { error: resetError } = await createClient().auth.resetPasswordForEmail(
      normalized,
      { redirectTo }
    )

    if (resetError) {
      setError('Något gick fel. Kontrollera att e-postadressen stämmer och försök igen.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-[28px] font-bold tracking-tight text-[#FF6B35]">
            FESTEN.
          </Link>
          <p className="mt-2 text-[14px] leading-[1.43] text-[#6a6a6a]">Återställ lösenord</p>
        </div>

        {done ? (
          <SettingsSection title="Kolla din inkorg!">
            <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-6">
              Om det finns ett konto för{' '}
              <span className="font-medium text-[#222222]">{email}</span> har vi skickat en
              länk för att välja ett nytt lösenord.
            </p>
            <Link
              href="/?auth=1"
              className="text-[14px] font-medium text-[#FF6B35] hover:underline"
            >
              Tillbaka till inloggning
            </Link>
          </SettingsSection>
        ) : (
          <>
            <SettingsSection title="Glömt lösenord?">
              <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-5">
                Ange din e-post så skickar vi en länk där du kan välja ett nytt lösenord.
              </p>
              {error && (
                <div
                  className="mb-4 px-4 py-3 text-[14px]"
                  style={{
                    color: t.colors.error,
                    backgroundColor: '#fff5f3',
                    borderRadius: t.rounded.sm,
                    border: `1px solid #f5c6c0`,
                  }}
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <SettingsInput
                  id="email"
                  label="E-postadress"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="din@epost.se"
                  autoComplete="email"
                />
                <SettingsButton
                  type="submit"
                  className="w-full"
                  disabled={!email.trim() || loading}
                >
                  {loading ? 'Skickar...' : 'Skicka återställningslänk'}
                </SettingsButton>
              </form>
            </SettingsSection>

            <p className="mt-6 text-center text-[14px] text-[#6a6a6a]">
              <Link href="/?auth=1" className="font-medium text-[#FF6B35] hover:underline">
                Tillbaka till inloggning
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
