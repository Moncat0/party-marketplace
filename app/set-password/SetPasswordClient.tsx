'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  needsPasswordSetup,
  parseSetPasswordNext,
  PASSWORD_SET_METADATA_KEY,
} from '@/lib/auth-password'
import {
  getPasswordChecks,
  isPasswordValid,
  passwordsMatch,
} from '@/lib/auth-compliance'
import { setIntentCookie, type AuthIntent } from '@/lib/auth-intent'
import { GOOGLE_OAUTH_SCOPES } from '@/lib/google-birthday'
import AuthPasswordInput from '@/components/auth/AuthPasswordInput'
import PasswordHint from '@/components/auth/PasswordHint'
import FormErrorAlert from '@/components/auth/FormErrorAlert'
import { Button } from '@/components/ui/button'

export default function SetPasswordClient({
  previewMode = false,
  previewEmail = 'preview@festen.local',
}: {
  previewMode?: boolean
  previewEmail?: string
} = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = parseSetPasswordNext(searchParams.get('next')) ?? '/'

  const [checking, setChecking] = useState(!previewMode)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(previewMode ? previewEmail : null)
  const pwChecks = useMemo(() => getPasswordChecks(password), [password])
  const match = confirm.length > 0 ? passwordsMatch(password, confirm) : false

  useEffect(() => {
    if (previewMode) {
      setChecking(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/?auth=1&next=${encodeURIComponent('/set-password')}`)
        return
      }
      if (!needsPasswordSetup(user)) {
        router.replace(nextPath)
        return
      }
      if (!cancelled) {
        setEmail(user.email ?? null)
        setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, nextPath, previewMode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (previewMode) {
      setError('Preview only — lösenord sparas inte här.')
      return
    }
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
      setError('Kunde inte spara lösenordet. Försök igen.')
      setLoading(false)
      return
    }
    router.replace(nextPath)
  }

  async function continueWithGoogle() {
    if (previewMode) {
      setError('Preview only — Google-koppling fungerar inte här.')
      return
    }
    setOauthLoading(true)
    setError(null)
    const intent: AuthIntent =
      nextPath.startsWith('/onboarding') || nextPath.startsWith('/dashboard')
        ? 'provider'
        : 'planner'
    setIntentCookie(intent)
    const origin = window.location.origin
    const params = new URLSearchParams({ next: nextPath, intent })
    const redirectTo = `${origin}/auth/callback?${params.toString()}`

    const supabase = createClient()
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo,
        scopes: GOOGLE_OAUTH_SCOPES,
        queryParams: { include_granted_scopes: 'true' },
      },
    })
    if (linkError) {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: GOOGLE_OAUTH_SCOPES,
          queryParams: { include_granted_scopes: 'true' },
        },
      })
      if (signInError) {
        setError(
          'Kunde inte koppla Google. Skapa ett lösenord istället, eller försök igen.'
        )
        setOauthLoading(false)
      }
    }
  }

  if (checking) {
    return (
      <main className="flex h-dvh items-center justify-center bg-white px-4">
        <p className="text-[14px] text-[#6a6a6a]">Laddar…</p>
      </main>
    )
  }

  return (
    <main className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-[28px] font-bold tracking-tight text-[#FF6B35]">
              FESTEN.
            </Link>
            <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-[#222222]">
              Säkra ditt konto
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6a6a6a]">
              Skapa ett lösenord så du enkelt kan logga in nästa gång
              {email ? (
                <>
                  {' '}
                  med <span className="font-medium text-[#222222]">{email}</span>
                </>
              ) : null}
              .
            </p>
          </div>

          {error && <FormErrorAlert className="mb-4 text-[14px]">{error}</FormErrorAlert>}

          <form
            id="set-password-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-3.5"
          >
            <div>
              <label
                htmlFor="set-password"
                className="mb-1.5 block text-[12px] font-medium text-foreground"
              >
                Lösenord
              </label>
              <AuthPasswordInput
                id="set-password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nytt lösenord"
                required
              />
            </div>
            <div>
              <label
                htmlFor="set-password-confirm"
                className="mb-1.5 block text-[12px] font-medium text-foreground"
              >
                Bekräfta lösenord
              </label>
              <AuthPasswordInput
                id="set-password-confirm"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Upprepa lösenordet"
                required
              />
            </div>
            <PasswordHint checks={pwChecks} match={match} />
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#ebebeb]" />
            <span className="text-[12px] text-[#6a6a6a]">eller</span>
            <div className="h-px flex-1 bg-[#ebebeb]" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading || oauthLoading}
            onClick={() => void continueWithGoogle()}
            className="h-12 w-full rounded-xl border-[#222222] text-[16px] font-semibold text-[#222222]"
          >
            {oauthLoading ? 'Öppnar Google…' : 'Fortsätt med Google'}
          </Button>
          <p className="mt-3 text-center text-[13px] text-[#6a6a6a]">
            Då behöver du inte skapa ett lösenord.
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[#ebebeb] bg-white px-4 py-3.5">
        <div className="mx-auto max-w-md">
          <Button
            type="submit"
            form="set-password-form"
            disabled={loading || oauthLoading}
            className="h-12 w-full rounded-xl text-[16px] font-semibold"
          >
            {loading ? 'Sparar…' : 'Spara lösenord och fortsätt'}
          </Button>
        </div>
      </div>
    </main>
  )
}
