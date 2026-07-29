'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import {
  parseAuthIntent,
  setIntentCookie,
  type AuthIntent,
} from '@/lib/auth-intent'
import { AUTH_INTENT_METADATA_KEY } from '@/lib/ensure-user'
import { PASSWORD_SET_METADATA_KEY } from '@/lib/auth-password'
import {
  formatLastLogin,
  getRememberedAccounts,
  maskEmail,
  rememberAccount,
  type RememberedAccount,
} from '@/lib/remembered-accounts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AuthView = 'welcome' | 'fresh' | 'check-email'

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
  const [mode, setMode] = useState<'login' | 'signup'>(() =>
    defaultIntent === 'provider' ? 'signup' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  /** Why check-email was shown — affects copy + resend */
  const [magicPurpose, setMagicPurpose] = useState<'signup' | 'login'>('signup')

  useEffect(() => {
    const remembered = getRememberedAccounts()
    setAccounts(remembered)
    if (!initialView) {
      setView(remembered.length > 0 ? 'welcome' : 'fresh')
    }
    setHydrated(true)
  }, [initialView])

  useEffect(() => {
    if (view === 'welcome') {
      setAccounts(getRememberedAccounts())
    }
  }, [view])

  useEffect(() => {
    setIntentCookie(intentParam ?? defaultIntent)
  }, [intentParam, defaultIntent])

  // Magic link often opens in a new tab. When this tab regains focus (or
  // cookies sync), continue the journey so “check inbox” doesn’t strand them.
  useEffect(() => {
    if (view !== 'check-email') return

    const supabase = createClient()
    let cancelled = false

    async function continueIfSignedIn() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled || !session?.user) return
      window.location.href = postAuthHref()
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        window.location.href = postAuthHref()
      }
    })

    function onVisible() {
      if (document.visibilityState === 'visible') void continueIfSignedIn()
    }

    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    const poll = window.setInterval(() => void continueIfSignedIn(), 2500)
    void continueIfSignedIn()

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(poll)
    }
    // postAuthHref reads intent/next from closure — rebuild when those change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, next, intentParam, defaultIntent])

  function effectiveIntent(): AuthIntent {
    return intentParam ?? defaultIntent
  }

  function callbackUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const intent = effectiveIntent()
    const destHint =
      next && next.startsWith('/') && !next.startsWith('//')
        ? next
        : intent === 'provider'
          ? '/onboarding'
          : '/'
    const params = new URLSearchParams({ next: destHint, intent })
    return `${origin}/auth/callback?${params.toString()}`
  }

  function postAuthHref(): string {
    const intent = effectiveIntent()
    const destHint =
      next && next.startsWith('/') && !next.startsWith('//')
        ? next
        : intent === 'provider'
          ? '/onboarding'
          : '/'
    const params = new URLSearchParams({ next: destHint, intent })
    return `/auth/continue?${params.toString()}`
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

  async function sendSignupMagicLink(targetEmail: string) {
    setLoading(true)
    resetMessages()
    const normalized = targetEmail.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setError('Ange en giltig e-postadress.')
      setLoading(false)
      return
    }

    const intent = effectiveIntent()
    setIntentCookie(intent)
    setEmail(normalized)
    setMode('signup')

    const supabase = createClient()

    // Magic-link OTP does not error when the email already exists — it silently
    // re-authenticates. Block “Skapa konto” and steer them to login instead.
    try {
      const res = await fetch('/api/auth/email-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      })
      if (res.ok) {
        const json = (await res.json()) as { exists?: boolean }
        if (json.exists) {
          setError(
            'Det finns redan ett konto med den e-postadressen. Logga in istället.'
          )
          setMode('login')
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.warn('[AuthPanel] email-exists check failed:', e)
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: callbackUrl(),
        data: {
          [AUTH_INTENT_METADATA_KEY]: intent,
          [PASSWORD_SET_METADATA_KEY]: false,
        },
      },
    })

    if (otpError) {
      const msg = otpError.message?.toLowerCase() ?? ''
      if (msg.includes('already') || msg.includes('registered')) {
        setError('Det finns redan ett konto med den e-postadressen. Logga in istället.')
        setMode('login')
      } else if (msg.includes('rate') || msg.includes('security')) {
        setError('För många försök. Vänta en stund och försök igen.')
      } else {
        setError('Kunde inte skicka länken. Kontrollera e-postadressen och försök igen.')
      }
      setLoading(false)
      return
    }

    rememberAccount({ email: normalized })
    setMagicPurpose('signup')
    setView('check-email')
    setLoading(false)
  }

  /** Escape hatch for accounts that never set a password after magic signup. */
  async function sendLoginMagicLink(targetEmail: string) {
    setLoading(true)
    resetMessages()
    const normalized = targetEmail.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setError('Ange en giltig e-postadress.')
      setLoading(false)
      return
    }

    const intent = effectiveIntent()
    setIntentCookie(intent)
    setEmail(normalized)
    setMode('login')

    const { error: otpError } = await createClient().auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: callbackUrl(),
        data: { [AUTH_INTENT_METADATA_KEY]: intent },
      },
    })

    if (otpError) {
      const msg = otpError.message?.toLowerCase() ?? ''
      if (msg.includes('signups not allowed') || msg.includes('user not found')) {
        setError('Inget konto med den e-postadressen. Välj Skapa konto istället.')
        setMode('signup')
      } else if (msg.includes('rate') || msg.includes('security')) {
        setError('För många försök. Vänta en stund och försök igen.')
      } else {
        setError('Kunde inte skicka länken. Kontrollera e-postadressen och försök igen.')
      }
      setLoading(false)
      return
    }

    rememberAccount({ email: normalized })
    setMagicPurpose('login')
    setView('check-email')
    setLoading(false)
  }

  async function loginWithPassword(targetEmail: string, targetPassword: string) {
    setLoading(true)
    resetMessages()
    const normalized = targetEmail.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setError('Ange en giltig e-postadress.')
      setLoading(false)
      return
    }
    if (!targetPassword) {
      setError('Ange ditt lösenord.')
      setLoading(false)
      return
    }

    setIntentCookie(effectiveIntent())
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password: targetPassword,
    })

    if (signInError) {
      const msg = signInError.message?.toLowerCase() ?? ''
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setError('Fel e-post eller lösenord. Försök igen eller återställ lösenordet.')
      } else if (msg.includes('email not confirmed')) {
        setError('Bekräfta din e-post via länken vi skickade innan du loggar in.')
      } else {
        setError('Kunde inte logga in. Försök igen.')
      }
      setLoading(false)
      return
    }

    rememberAccount({
      email: normalized,
      name: data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name,
      avatarUrl: data.user?.user_metadata?.avatar_url,
    })

    // Lazy-mark password users who never got the metadata flag
    if (data.user && data.user.user_metadata?.[PASSWORD_SET_METADATA_KEY] !== true) {
      await supabase.auth.updateUser({
        data: { [PASSWORD_SET_METADATA_KEY]: true },
      })
    }

    window.location.href = postAuthHref()
  }

  function handleFreshSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'signup') {
      void sendSignupMagicLink(email)
    } else {
      void loginWithPassword(email, password)
    }
  }

  function switchAuthMode(nextMode: 'login' | 'signup') {
    setMode(nextMode)
    setPassword('')
    resetMessages()
  }

  function pickRememberedAccount(account: RememberedAccount) {
    setEmail(account.email)
    setPassword('')
    setMode('login')
    resetMessages()
    setView('fresh')
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
            Välj ett konto och logga in med lösenord eller Google.
          </p>

          <ul className="mt-6 divide-y divide-border/60">
            {accounts.map(account => (
              <li key={account.email}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => pickRememberedAccount(account)}
                  className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-xl disabled:opacity-50"
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
                setMode('signup')
                resetMessages()
                setView('fresh')
              }}
              className="text-[15px] font-semibold text-foreground underline-offset-2 hover:underline"
            >
              Inte du? Skapa konto eller använd annan e-post
            </button>
          </div>
        </div>
      )}

      {view === 'fresh' && (
        <div className="pt-1">
          <div className="mb-6 text-center">
            <p className="text-[28px] font-bold tracking-tight text-primary">FESTEN.</p>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground">
              {mode === 'signup' ? 'Skapa konto' : 'Logga in'}
            </h2>
            {intentHint && mode === 'signup' ? (
              <p className="mt-2 text-[13px] text-muted-foreground">{intentHint}</p>
            ) : null}
            <p className="mt-2 text-[14px] text-muted-foreground">
              {mode === 'signup'
                ? 'Vi skickar en länk till din e-post för att komma igång.'
                : 'Logga in med e-post och lösenord.'}
            </p>
          </div>

          <form onSubmit={handleFreshSubmit} className="flex flex-col gap-4">
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
            {mode === 'login' && (
              <>
                <label className="sr-only" htmlFor="auth-password">
                  Lösenord
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Lösenord"
                  autoComplete="current-password"
                  required
                  className="h-14 w-full rounded-xl border border-border bg-background px-4 text-[16px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
                <div className="flex flex-col gap-1 -mt-1">
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-medium text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Glömt lösenord?
                    </Link>
                  </div>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void sendLoginMagicLink(email)}
                      className="text-[13px] font-medium text-foreground/70 underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      Logga in med e-postlänk istället
                    </button>
                  </div>
                </div>
              </>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              {loading
                ? mode === 'signup'
                  ? 'Skickar…'
                  : 'Loggar in…'
                : mode === 'signup'
                  ? 'Skicka bekräftelselänk'
                  : 'Logga in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-[14px] text-muted-foreground">
            {mode === 'signup' ? 'Har du redan ett konto?' : 'Ny på FESTEN.?'}{' '}
            <button
              type="button"
              onClick={() => switchAuthMode(mode === 'signup' ? 'login' : 'signup')}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {mode === 'signup' ? 'Logga in' : 'Skapa konto'}
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

      {view === 'check-email' && (
        <div className="pt-1 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0EB]">
            <MailIcon />
          </div>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            Öppna din e-post
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Vi har skickat en länk till{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Öppna den i den här webbläsaren om du kan — annars fortsätter du i
            fliken som länken öppnar, och den här stängs automatiskt när du är inloggad.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              asChild
              className="h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noreferrer">
                Öppna Gmail
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="h-12 w-full rounded-xl border-[#222222] text-[16px] font-semibold text-[#222222]"
            >
              <a href="https://outlook.live.com/mail/0/" target="_blank" rel="noreferrer">
                Öppna Outlook
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="h-12 w-full rounded-xl border-[#222222] text-[16px] font-semibold text-[#222222]"
            >
              <a href={`mailto:${encodeURIComponent(email)}`}>Öppna e-postappen</a>
            </Button>
          </div>

          <p className="mt-5 text-[13px] text-muted-foreground">
            Ser du inget? Kolla skräppost. Väntar på att du klickar på länken…
          </p>

          <Button
            type="button"
            disabled={loading}
            variant="ghost"
            onClick={() =>
              void (magicPurpose === 'signup'
                ? sendSignupMagicLink(email)
                : sendLoginMagicLink(email))
            }
            className="mt-4 h-10 w-full text-[14px] font-semibold text-foreground/80"
          >
            {loading ? 'Skickar…' : 'Skicka länken igen'}
          </Button>

          <button
            type="button"
            onClick={() => {
              resetMessages()
              setView('fresh')
            }}
            className="mt-2 text-[14px] font-medium text-foreground/70 hover:text-foreground"
          >
            ← Byt e-postadress
          </button>
        </div>
      )}
    </div>
  )
}

function MailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#FF6B35]">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="m5.5 7.5 6.5 5 6.5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
