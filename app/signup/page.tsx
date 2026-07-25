'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  parseAuthIntent,
  resolvePostAuthDestination,
  setIntentCookie,
  clearIntentCookie,
  type AuthIntent,
} from '@/lib/auth-intent'
import { ensureAppUser } from '@/lib/ensure-user'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

type Role = AuthIntent

function SignupForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const intentParam = parseAuthIntent(searchParams.get('intent'))
  const defaultIntent: AuthIntent =
    intentParam ??
    (next === '/onboarding' || next?.startsWith('/onboarding') ? 'provider' : 'planner')

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [role, setRole] = useState<Role | null>(intentParam ?? (mode === 'signup' ? null : defaultIntent))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const intent = intentParam ?? (role === 'provider' ? 'provider' : 'planner')
    setIntentCookie(intent)
  }, [intentParam, role])

  function effectiveIntent(): AuthIntent {
    if (role === 'provider' || role === 'planner') return role
    return defaultIntent
  }

  function destinationAfterAuth(profile?: { is_published?: boolean | null } | null): string {
    return resolvePostAuthDestination({
      intent: effectiveIntent(),
      next,
      hasProviderProfile: !!profile,
      isPublished: !!profile?.is_published,
    })
  }

  function callbackUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const intent = effectiveIntent()
    const destHint =
      next && next.startsWith('/') && !next.startsWith('//')
        ? next
        : intent === 'provider'
          ? '/onboarding'
          : '/planner/dashboard'
    const params = new URLSearchParams({ next: destHint, intent })
    return `${origin}/auth/callback?${params.toString()}`
  }

  function reset() {
    setEmail('')
    setPassword('')
    setError(null)
    setMessage(null)
  }

  async function startOAuth(provider: 'google' | 'facebook' | 'apple') {
    setLoading(true)
    setError(null)
    setIntentCookie(effectiveIntent())
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    })
    if (error) {
      const labels = { google: 'Google', facebook: 'Facebook', apple: 'Apple' }
      setError(`Det gick inte att logga in med ${labels[provider]}. Försök igen.`)
      setLoading(false)
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    const supabase = createClient()
    const intent = effectiveIntent()
    setIntentCookie(intent)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl() },
      })
      if (error) {
        setError('Det gick inte att skapa kontot. Kontrollera din e-post och ditt lösenord.')
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await ensureAppUser(supabase, user, { intent })
          const { data: profile } = await supabase
            .from('provider_profiles')
            .select('is_published')
            .eq('user_id', user.id)
            .maybeSingle()
          clearIntentCookie()
          window.location.href = destinationAfterAuth(profile)
          return
        }
        setMessage('Vi har skickat en bekräftelse till din e-post. Kolla inkorgen!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Fel e-post eller lösenord. Försök igen.')
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        let profile: { is_published?: boolean | null } | null = null
        if (user) {
          await ensureAppUser(supabase, user, { intent })
          const { data } = await supabase
            .from('provider_profiles')
            .select('is_published')
            .eq('user_id', user.id)
            .maybeSingle()
          profile = data
        }
        clearIntentCookie()
        window.location.href = destinationAfterAuth(profile)
        return
      }
    }

    setLoading(false)
  }

  const showRolePicker = mode === 'signup' && role === null && !intentParam
  const displayRole = intentParam ?? role

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-[28px] font-bold tracking-tight text-[#FF6B35]">
            FESTEN.
          </Link>
          <p className="mt-2 text-[14px] leading-[1.43] text-[#6a6a6a]">
            Logga in eller skapa konto
          </p>
          {intentParam === 'provider' && (
            <p className="mt-1 text-[13px] text-[#929292]">Du är på väg att erbjuda en tjänst</p>
          )}
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 text-[14px]"
            style={{
              color: t.colors.error,
              backgroundColor: '#fff5f3',
              borderRadius: t.rounded.sm,
              border: '1px solid #f5c6c0',
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="mb-4 px-4 py-3 text-[14px]"
            style={{
              color: t.colors.success,
              backgroundColor: '#f0faf6',
              borderRadius: t.rounded.sm,
              border: '1px solid #b8e0d0',
            }}
          >
            {message}
          </div>
        )}

        {showRolePicker ? (
          <SettingsSection title="Hur vill du använda FESTEN.?">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setRole('planner')}
                className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors"
                style={{
                  borderRadius: t.rounded.md,
                  border: `1px solid ${t.colors.hairline}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = t.colors.primary
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = t.colors.hairline
                }}
              >
                <span className="text-2xl mt-0.5">🎉</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#222222]">Jag planerar ett kalas</p>
                  <p className="text-[13px] text-[#6a6a6a] mt-0.5">
                    Hitta och boka lokala talanger till ditt event
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('provider')}
                className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors"
                style={{
                  borderRadius: t.rounded.md,
                  border: `1px solid ${t.colors.hairline}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = t.colors.primary
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = t.colors.hairline
                }}
              >
                <span className="text-2xl mt-0.5">🎤</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#222222]">Jag erbjuder en tjänst</p>
                  <p className="text-[13px] text-[#6a6a6a] mt-0.5">
                    Skapa en profil och bli hittad av arrangörer
                  </p>
                </div>
              </button>
            </div>

            <p className="pt-5 text-center text-[14px] text-[#6a6a6a]">
              Har du redan ett konto?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setRole(defaultIntent)
                  reset()
                }}
                className="font-medium text-[#FF6B35] hover:underline"
              >
                Logga in
              </button>
            </p>
          </SettingsSection>
        ) : (
          <SettingsSection
            title={mode === 'signup' ? 'Skapa konto' : 'Logga in'}
            description={
              mode === 'signup' && displayRole && !intentParam
                ? displayRole === 'planner'
                  ? 'Du registrerar dig som planerare'
                  : 'Du registrerar dig som talang'
                : undefined
            }
          >
            {mode === 'signup' && displayRole && !intentParam && (
              <button
                type="button"
                onClick={() => setRole(null)}
                className="mb-4 text-[13px] font-medium text-[#FF6B35] hover:underline"
              >
                Ändra roll
              </button>
            )}

            <div className="space-y-3">
              <SettingsButton
                variant="secondary"
                className="w-full gap-3"
                disabled={loading}
                onClick={() => startOAuth('google')}
              >
                <GoogleIcon />
                Fortsätt med Google
              </SettingsButton>
              <SettingsButton
                variant="secondary"
                className="w-full gap-3"
                disabled={loading}
                onClick={() => startOAuth('facebook')}
              >
                <FacebookIcon />
                Fortsätt med Facebook
              </SettingsButton>
              <SettingsButton
                variant="secondary"
                className="w-full gap-3"
                disabled={loading}
                onClick={() => startOAuth('apple')}
              >
                <AppleIcon />
                Fortsätt med Apple
              </SettingsButton>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: t.colors.hairline }} />
              <span className="text-[12px] text-[#6a6a6a]">eller</span>
              <div className="flex-1 h-px" style={{ backgroundColor: t.colors.hairline }} />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <SettingsInput
                id="email"
                label="E-postadress"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="din@epost.se"
                required
                autoComplete="email"
              />
              <SettingsInput
                id="password"
                label="Lösenord"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Minst 8 tecken"
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                labelAction={
                  mode === 'login' ? (
                    <Link href="/forgot-password" className="text-[13px] text-[#FF6B35] hover:underline">
                      Glömt lösenordet?
                    </Link>
                  ) : undefined
                }
              />
              <SettingsButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Laddar...' : mode === 'signup' ? 'Skapa konto' : 'Logga in'}
              </SettingsButton>
            </form>

            <p className="mt-6 text-center text-[14px] text-[#6a6a6a]">
              {mode === 'signup' ? 'Har du redan ett konto?' : 'Har du inget konto?'}{' '}
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') {
                    setMode('signup')
                    setRole(intentParam)
                    reset()
                  } else {
                    setMode('login')
                    setRole(defaultIntent)
                    reset()
                  }
                }}
                className="font-medium text-[#FF6B35] hover:underline"
              >
                {mode === 'signup' ? 'Logga in' : 'Registrera dig'}
              </button>
            </p>
          </SettingsSection>
        )}
      </div>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#222222">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}
