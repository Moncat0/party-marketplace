'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PASSWORD_SET_METADATA_KEY } from '@/lib/auth-password'
import {
  getPasswordChecks,
  isPasswordValid,
  passwordsMatch,
} from '@/lib/auth-compliance'
import AuthPasswordInput from '@/components/auth/AuthPasswordInput'
import PasswordHint from '@/components/auth/PasswordHint'
import FormErrorAlert from '@/components/auth/FormErrorAlert'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pwChecks = useMemo(() => getPasswordChecks(password), [password])
  const match = confirm.length > 0 ? passwordsMatch(password, confirm) : false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(password)) {
      setError('Lösenordet måste ha minst 8 tecken, versal, gemen och siffra.')
      return
    }
    if (!passwordsMatch(password, confirm)) {
      setError('Lösenorden matchar inte.')
      return
    }

    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({
      password,
      data: { [PASSWORD_SET_METADATA_KEY]: true },
    })
    if (updateError) {
      setError('Något gick fel. Länken kan ha gått ut — begär en ny återställningslänk.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[28px] font-bold tracking-tight text-[#FF6B35]">
            FESTEN.
          </Link>
          <p className="mt-2 text-[14px] leading-[1.43] text-[#6a6a6a]">Välj ett nytt lösenord</p>
        </div>

        <div className="rounded-2xl border border-[#dddddd] bg-white p-6 sm:p-8">
          {done ? (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#222222]">
                Lösenord uppdaterat!
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6a6a6a]">
                Ditt lösenord är nu ändrat. Du kan logga in med det nya lösenordet.
              </p>
              <Button asChild className="mt-6 h-12 w-full rounded-xl text-[16px] font-semibold">
                <Link href="/">Gå till startsidan</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#222222]">
                Nytt lösenord
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6a6a6a]">
                Samma krav som när du skapar konto.
              </p>

              {error && (
                <FormErrorAlert className="mt-4 text-[14px]">
                  {error}{' '}
                  {error.includes('gått ut') && (
                    <Link href="/?auth=1&view=forgot" className="font-medium">
                      Begär ny länk
                    </Link>
                  )}
                </FormErrorAlert>
              )}

              <form onSubmit={e => void handleSubmit(e)} className="mt-5 flex flex-col gap-3.5">
                <div>
                  <label
                    htmlFor="reset-password"
                    className="mb-1.5 block text-[12px] font-medium text-foreground"
                  >
                    Nytt lösenord
                  </label>
                  <AuthPasswordInput
                    id="reset-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nytt lösenord"
                    autoComplete="new-password"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="reset-confirm"
                    className="mb-1.5 block text-[12px] font-medium text-foreground"
                  >
                    Bekräfta lösenord
                  </label>
                  <AuthPasswordInput
                    id="reset-confirm"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Upprepa lösenordet"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <PasswordHint checks={pwChecks} match={match} />

                <Button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="mt-1 h-12 w-full rounded-xl text-[16px] font-semibold"
                >
                  {loading ? 'Sparar…' : 'Spara nytt lösenord'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
