'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PASSWORD_SET_METADATA_KEY } from '@/lib/auth-password'
import { isPasswordValid } from '@/lib/auth-compliance'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(password)) {
      setError('Lösenordet måste ha minst 8 tecken, versal, gemen och siffra.')
      return
    }
    if (password !== confirm) {
      setError('Lösenorden matchar inte.')
      return
    }

    setLoading(true)
    const { error } = await createClient().auth.updateUser({
      password,
      data: { [PASSWORD_SET_METADATA_KEY]: true },
    })
    if (error) {
      setError('Något gick fel. Länken kan ha gått ut — begär en ny återställningslänk.')
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
          <p className="mt-2 text-[14px] leading-[1.43] text-[#6a6a6a]">Välj ett nytt lösenord</p>
        </div>

        {done ? (
          <SettingsSection title="Lösenord uppdaterat!">
            <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-6">
              Ditt lösenord är nu ändrat. Du kan logga in med det nya lösenordet.
            </p>
            <Link href="/" className="block">
              <SettingsButton className="w-full">Gå till startsidan</SettingsButton>
            </Link>
          </SettingsSection>
        ) : (
          <SettingsSection title="Nytt lösenord">
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
                {error}{' '}
                {error.includes('gått ut') && (
                  <Link href="/forgot-password" className="font-medium underline">
                    Begär ny länk
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <SettingsInput
                id="password"
                label="Nytt lösenord"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Minst 8 tecken"
                autoComplete="new-password"
              />
              <SettingsInput
                id="confirm"
                label="Bekräfta lösenord"
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Upprepa lösenordet"
                autoComplete="new-password"
              />
              <SettingsButton
                type="submit"
                className="w-full"
                disabled={!password || !confirm || loading}
              >
                {loading ? 'Sparar...' : 'Spara nytt lösenord'}
              </SettingsButton>
            </form>
          </SettingsSection>
        )}
      </div>
    </main>
  )
}
