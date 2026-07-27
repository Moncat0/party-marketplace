'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import {
  parseAuthIntent,
  resolvePostAuthDestination,
  setIntentCookie,
  clearIntentCookie,
  type AuthIntent,
} from '@/lib/auth-intent'
import { ensureAppUser } from '@/lib/ensure-user'
import { needsDisplayName } from '@/lib/profile-completeness'
import {
  formatLastLogin,
  getRememberedAccounts,
  maskEmail,
  rememberAccount,
  type RememberedAccount,
} from '@/lib/remembered-accounts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AuthView = 'welcome' | 'fresh' | 'password'

type Props = {
  intent?: AuthIntent | null
  next?: string | null
  /** Called when user dismisses (modal only) */
  onClose?: () => void
  /** Show close control in the panel header (modal) */
  showClose?: boolean
  className?: string
  /** Force starting view; otherwise welcome if accounts exist else fresh */
  initialView?: AuthView
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function AuthPanel({
  intent: intentProp = null,
  next = null,
  onClose,
  showClose = false,
  className,
  initialView,
}: Props) {
  const intentParam = parseAuthIntent(intentProp)
  const defaultIntent: AuthIntent =
    intentParam ??
    (next === '/onboarding' || next?.startsWith('/onboarding') ? 'provider' : 'planner')

  const [accounts, setAccounts] = useState<RememberedAccount[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [view, setView] = useState<AuthView>(initialView ?? 'fresh')
  const [passwordReturnView, setPasswordReturnView] = useState<AuthView>('fresh')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const remembered = getRememberedAccounts()
    setAccounts(remembered)
    if (!initialView) {
      setView(remembered.length > 0 ? 'welcome' : 'fresh')
    }
    setHydrated(true)
  }, [initialView])

  // Re-read when returning to welcome (e.g. after signup message then reopening)
  useEffect(() => {
    if (view === 'welcome') {
      setAccounts(getRememberedAccounts())
    }
  }, [view])

  useEffect(() => {
    setIntentCookie(intentParam ?? defaultIntent)
  }, [intentParam, defaultIntent])

  function effectiveIntent(): AuthIntent {
    return intentParam ?? defaultIntent
  }

  function destinationAfterAuth(opts?: {
    hasProviderProfile?: boolean
    isPublished?: boolean | null
    missingDisplayName?: boolean
  }): string {
    return resolvePostAuthDestination({
      intent: effectiveIntent(),
      next,
      hasProviderProfile: !!opts?.hasProviderProfile,
      isPublished: !!opts?.isPublished,
      needsDisplayName: !!opts?.missingDisplayName,
    })
  }

  async function finishAuth(userId: string) {
    const supabase = createClient()
    const [{ data: profile }, { data: appUser }] = await Promise.all([
      supabase
        .from('provider_profiles')
        .select('id, services(is_published)')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('users').select('name, first_name').eq('id', userId).maybeSingle(),
    ])
    const service = profile
      ? Array.isArray(profile.services)
        ? profile.services[0]
        : profile.services
      : null
    clearIntentCookie()
    window.location.href = destinationAfterAuth({
      hasProviderProfile: !!profile,
      isPublished: !!service?.is_published,
      missingDisplayName: needsDisplayName(appUser),
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

  function resetMessages() {
    setError(null)
    setMessage(null)
  }

  async function startOAuth(provider: 'google' | 'apple') {
    setLoading(true)
    resetMessages()
    setIntentCookie(effectiveIntent())
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    })
    if (oauthError) {
      const labels = { google: 'Google', apple: 'Apple' }
      setError(`Det gick inte att logga in med ${labels[provider]}. Försök igen.`)
      setLoading(false)
    }
  }

  function goToPassword(prefillEmail?: string, from: AuthView = 'fresh') {
    resetMessages()
    if (prefillEmail) setEmail(prefillEmail)
    setPassword('')
    setMode('login')
    setPasswordReturnView(from)
    setView('password')
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    const value = email.trim()
    if (!isValidEmail(value)) {
      setError('Ange en giltig e-postadress.')
      return
    }
    setEmail(value.toLowerCase())
    goToPassword(value.toLowerCase(), 'fresh')
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    resetMessages()
    const supabase = createClient()
    const intent = effectiveIntent()
    setIntentCookie(intent)
    const normalizedEmail = email.trim().toLowerCase()

    if (mode === 'signup') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: callbackUrl() },
      })
      if (signUpError) {
        setError('Det gick inte att skapa kontot. Kontrollera din e-post och ditt lösenord.')
        setLoading(false)
        return
      }

      // Always remember the email so Welcome back shows this account next time
      const signedUser = signUpData.user
      rememberAccount({
        email: signedUser?.email ?? normalizedEmail,
        name: signedUser?.user_metadata?.full_name ?? signedUser?.user_metadata?.name ?? null,
        avatarUrl: signedUser?.user_metadata?.avatar_url ?? null,
      })

      // Session present = email confirm disabled / auto-login
      if (signUpData.session && signedUser) {
        await ensureAppUser(supabase, signedUser, { intent })
        await finishAuth(signedUser.id)
        return
      }

      // Fallback: session may already exist even if signUpData.session is null
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await ensureAppUser(supabase, user, { intent })
        rememberAccount({
          email: user.email ?? normalizedEmail,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        })
        await finishAuth(user.id)
        return
      }

      setMessage('Vi har skickat en bekräftelse till din e-post. Kolla inkorgen!')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })
    if (signInError) {
      setError('Fel e-post eller lösenord. Försök igen.')
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await ensureAppUser(supabase, user, { intent })
      rememberAccount({
        email: user.email ?? normalizedEmail,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      })
      await finishAuth(user.id)
      return
    }

    // Session established but getUser raced — still remember the email used
    rememberAccount({ email: normalizedEmail })
    clearIntentCookie()
    window.location.href = destinationAfterAuth({ missingDisplayName: true })
  }

  const intentHint = intentParam === 'provider' ? 'Du är på väg att erbjuda en tjänst' : null

  const socialButtons = useMemo(
    () => (
      <div className="flex gap-3 justify-center">
        <SocialIconButton
          label="Fortsätt med Google"
          disabled={loading}
          onClick={() => startOAuth('google')}
        >
          <GoogleIcon />
        </SocialIconButton>
        <SocialIconButton
          label="Fortsätt med Apple"
          disabled={loading}
          onClick={() => startOAuth('apple')}
        >
          <AppleIcon />
        </SocialIconButton>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startOAuth is stable enough for UI
    [loading]
  )

  if (!hydrated) {
    return (
      <div className={cn('w-full min-h-[280px]', className)} aria-busy="true" />
    )
  }

  return (
    <div className={cn('relative w-full', className)}>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
        >
          <CloseIcon />
        </button>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-[#f5c6c0] bg-[#fff5f3] px-4 py-3 text-[14px] text-[#C13515]">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-[#b8e0d0] bg-[#f0faf6] px-4 py-3 text-[14px] text-[#1D9E75]">
          {message}
        </div>
      )}

      {view === 'welcome' && (
        <div className="pt-2">
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            Välkommen tillbaka
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Välj ett konto att logga in med. Vi kan skicka en kod via e-post.
          </p>

          <ul className="mt-6 divide-y divide-border/60">
            {accounts.map(account => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => goToPassword(account.email, 'welcome')}
                  className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-xl"
                >
                  <AccountAvatar account={account} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-foreground">
                      {maskEmail(account.email)}
                    </span>
                    <span className="block text-[13px] text-muted-foreground">
                      {formatLastLogin(account.lastLoginAt)}
                    </span>
                  </span>
                  <ChevronIcon />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('')
                setPassword('')
                resetMessages()
                setView('fresh')
              }}
              className="text-[15px] font-semibold text-foreground underline-offset-2 hover:underline"
            >
              Inte du?
            </button>
          </div>
        </div>
      )}

      {view === 'fresh' && (
        <div className="pt-1">
          <div className="mb-6 text-center">
            <p className="text-[28px] font-bold tracking-tight text-primary">FESTEN.</p>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground">
              Logga in eller skapa konto
            </h2>
            {intentHint && (
              <p className="mt-2 text-[13px] text-muted-foreground">{intentHint}</p>
            )}
          </div>

          <form onSubmit={handleContinue} className="flex flex-col gap-4">
            <label className="sr-only" htmlFor="auth-email">
              E-postadress
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-postadress"
              autoComplete="email"
              required
              className="h-14 w-full rounded-xl border border-border bg-background px-4 text-[16px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              Fortsätt
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[12px] text-muted-foreground">eller</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {socialButtons}
        </div>
      )}

      {view === 'password' && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              resetMessages()
              setPassword('')
              setView(passwordReturnView)
            }}
            className="mb-4 text-[14px] font-medium text-foreground/70 hover:text-foreground"
          >
            ← Tillbaka
          </button>

          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            {mode === 'signup' ? 'Skapa konto' : 'Logga in'}
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">{email}</p>

          <form onSubmit={handlePasswordAuth} className="mt-6 flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-password" className="text-[14px] font-medium text-foreground">
                  Lösenord
                </label>
                {mode === 'login' && (
                  <Link href="/forgot-password" className="text-[13px] text-primary hover:underline">
                    Glömt lösenordet?
                  </Link>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={8}
                className="h-14 w-full rounded-xl border border-border bg-background px-4 text-[16px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              {loading ? 'Laddar...' : mode === 'signup' ? 'Skapa konto' : 'Logga in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] text-muted-foreground">
            {mode === 'signup' ? 'Har du redan ett konto?' : 'Har du inget konto?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setPassword('')
                resetMessages()
              }}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {mode === 'signup' ? 'Logga in' : 'Registrera dig'}
            </button>
          </p>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[12px] text-muted-foreground">eller</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {socialButtons}
        </div>
      )}
    </div>
  )
}

function AccountAvatar({ account }: { account: RememberedAccount }) {
  const initial =
    (account.name?.trim()?.[0] || account.email.trim()[0] || '?').toUpperCase()

  if (account.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={account.avatarUrl}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
      />
    )
  }

  return (
    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[16px] font-semibold text-foreground">
      {initial}
    </span>
  )
}

function SocialIconButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted-foreground">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden>
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

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#222222" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}
