'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'
import { AUTH_INTENT_METADATA_KEY } from '@/lib/ensure-user'
import { rememberAccount } from '@/lib/remembered-accounts'

/**
 * Legacy route — password auth is replaced by magic links.
 * Keeps the URL working and sends a passwordless sign-in link instead.
 */
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
        ? `${window.location.origin}/auth/callback?next=/planner/dashboard&intent=planner`
        : '/auth/callback?next=/planner/dashboard&intent=planner'

    const { error: otpError } = await createClient().auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
        data: { [AUTH_INTENT_METADATA_KEY]: 'planner' },
      },
    })

    if (otpError) {
      setError('Något gick fel. Kontrollera att e-postadressen stämmer och försök igen.')
    } else {
      rememberAccount({ email: normalized })
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
          <p className="mt-2 text-[14px] leading-[1.43] text-[#6a6a6a]">Logga in med e-postlänk</p>
        </div>

        {done ? (
          <SettingsSection title="Kolla din inkorg!">
            <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-6">
              Vi har skickat en inloggningslänk till{' '}
              <span className="font-medium text-[#222222]">{email}</span>. Öppna länken för att
              logga in — inget lösenord behövs.
            </p>
            <Link
              href="/signup?intent=planner"
              className="text-[14px] font-medium text-[#FF6B35] hover:underline"
            >
              Tillbaka till inloggning
            </Link>
          </SettingsSection>
        ) : (
          <>
            <SettingsSection title="Skicka inloggningslänk">
              <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-5">
                FESTEN. använder inloggningslänkar istället för lösenord. Ange din e-post så skickar
                vi en länk.
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
                  {loading ? 'Skickar...' : 'Skicka inloggningslänk'}
                </SettingsButton>
              </form>
            </SettingsSection>

            <p className="mt-6 text-center text-[14px] text-[#6a6a6a]">
              <Link href="/signup?intent=planner" className="font-medium text-[#FF6B35] hover:underline">
                Tillbaka till inloggning
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
