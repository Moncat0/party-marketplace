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
  COUNTRY_DIALS,
  detectIdentifierKind,
  isValidE164,
  isValidEmail,
  toE164,
  type IdentifierKind,
} from '@/lib/auth-identifier'
import {
  formatLastLogin,
  getRememberedAccounts,
  maskEmail,
  rememberAccount,
  type RememberedAccount,
} from '@/lib/remembered-accounts'
import {
  getPasswordChecks,
  isPasswordValid,
  passwordsMatch,
  type PasswordChecks,
} from '@/lib/auth-compliance'
import { buildDisplayName } from '@/lib/profile-completeness'
import FinishSignupFields, {
  authInputClass,
  isAtLeast18,
} from '@/components/auth/FinishSignupFields'
import AuthPasswordInput from '@/components/auth/AuthPasswordInput'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AuthView =
  | 'welcome'
  | 'fresh'
  | 'finish-signup'
  | 'password'
  | 'confirm-code'
  | 'check-email'

type Props = {
  intent?: AuthIntent | null
  next?: string | null
  onClose?: () => void
  showClose?: boolean
  className?: string
  initialView?: AuthView
  /** @deprecated Airbnb uses one door — kept for openAuth callers */
  initialMode?: 'login' | 'signup'
}

/**
 * Airbnb-style auth:
 * 1) Log in or sign up — email Continue + Google (no terms)
 * 2a) Existing email → password
 * 2b) New email → Finish signing up (name, DOB, password, Agree and continue)
 * 2c) Phone → SMS code (kept below; gated by PHONE_AUTH_ENABLED)
 * Google new users finish on /complete-signup after OAuth.
 *
 * Set PHONE_AUTH_ENABLED to true to restore phone/OTP on the identify screen.
 */
const PHONE_AUTH_ENABLED = false

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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [identifierFocused, setIdentifierFocused] = useState(false)
  const [countryDial, setCountryDial] = useState(COUNTRY_DIALS[0].dial)
  const [email, setEmail] = useState('')
  const [phoneE164, setPhoneE164] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [accountExists, setAccountExists] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const identifierKind: IdentifierKind = detectIdentifierKind(identifier)
  // TEMP: email-only identify — country code UI restored when PHONE_AUTH_ENABLED
  const showPhoneCountry = PHONE_AUTH_ENABLED && identifierKind === 'phone'

  useEffect(() => {
    const remembered = getRememberedAccounts()
    setAccounts(remembered)
    if (!initialView) {
      setView(remembered.length > 0 ? 'welcome' : 'fresh')
    }
    if (initialView === 'confirm-code' && !phoneE164) {
      setPhoneE164('+46768513119')
    }
    if (initialView === 'password' && !email) {
      setEmail('demo@festen.se')
      setIdentifier('demo@festen.se')
    }
    if (initialView === 'finish-signup' && !email) {
      setEmail('ny@festen.se')
      setIdentifier('ny@festen.se')
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from initialView
  }, [initialView])

  useEffect(() => {
    if (view === 'welcome') setAccounts(getRememberedAccounts())
  }, [view])

  useEffect(() => {
    setIntentCookie(intentParam ?? defaultIntent)
  }, [intentParam, defaultIntent])

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

  async function startGoogle() {
    setLoading(true)
    resetMessages()
    setIntentCookie(effectiveIntent())
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
    if (oauthError) {
      setError('Det gick inte att fortsätta med Google. Försök igen.')
      setLoading(false)
    }
  }

  async function lookupExists(body: { email?: string; phone?: string }) {
    const res = await fetch('/api/auth/identifier-exists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { exists?: boolean }
    return !!json.exists
  }

  async function handleIdentifyContinue(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setIntentCookie(effectiveIntent())

    // --- Email-only identify (phone gated by PHONE_AUTH_ENABLED below) ---
    if (!PHONE_AUTH_ENABLED) {
      const normalized = identifier.trim().toLowerCase()
      if (!isValidEmail(normalized)) {
        setError('Ange en giltig e-postadress.')
        return
      }

      setLoading(true)
      setEmail(normalized)
      setPhoneE164('')

      try {
        const exists = await lookupExists({ email: normalized })
        if (exists === true) {
          setAccountExists(true)
          setPassword('')
          setView('password')
          setLoading(false)
          return
        }
        if (exists === false) {
          setAccountExists(false)
        }
      } catch (err) {
        console.warn('[AuthPanel] identifier-exists check failed:', err)
      }

      setPassword('')
      setConfirmPassword('')
      setView('finish-signup')
      setLoading(false)
      return
    }

    // --- Combined phone | email identify (restore when PHONE_AUTH_ENABLED) ---
    const kind = detectIdentifierKind(identifier)

    if (kind === 'email' || (kind === 'unknown' && identifier.includes('@'))) {
      const normalized = identifier.trim().toLowerCase()
      if (!isValidEmail(normalized)) {
        setError('Ange en giltig e-postadress.')
        return
      }

      setLoading(true)
      setEmail(normalized)
      setPhoneE164('')

      try {
        const exists = await lookupExists({ email: normalized })
        if (exists === true) {
          setAccountExists(true)
          setPassword('')
          setView('password')
          setLoading(false)
          return
        }
        if (exists === false) {
          setAccountExists(false)
        }
      } catch (err) {
        console.warn('[AuthPanel] identifier-exists check failed:', err)
      }

      setPassword('')
      setConfirmPassword('')
      setView('finish-signup')
      setLoading(false)
      return
    }

    if (kind === 'phone') {
      const e164 = toE164(countryDial, identifier)
      if (!isValidE164(e164)) {
        setError('Ange ett giltigt telefonnummer.')
        return
      }

      setLoading(true)
      setPhoneE164(e164)
      setEmail('')

      let exists = false
      try {
        const lookedUp = await lookupExists({ phone: e164 })
        if (lookedUp !== null) exists = lookedUp
      } catch (err) {
        console.warn('[AuthPanel] identifier-exists check failed:', err)
      }
      setAccountExists(exists)

      const { error: otpError } = await createClient().auth.signInWithOtp({
        phone: e164,
        options: {
          shouldCreateUser: true,
          data: {
            [AUTH_INTENT_METADATA_KEY]: effectiveIntent(),
          },
        },
      })

      if (otpError) {
        const msg = otpError.message?.toLowerCase() ?? ''
        if (
          msg.includes('sms') ||
          msg.includes('phone') ||
          msg.includes('provider') ||
          msg.includes('unsupported') ||
          msg.includes('disabled')
        ) {
          setError(
            'SMS-inloggning är inte tillgänglig just nu. Använd e-post eller Google istället.'
          )
        } else if (msg.includes('rate') || msg.includes('security')) {
          setError('För många försök. Vänta en stund och försök igen.')
        } else {
          setError('Kunde inte skicka bekräftelsekod. Försök igen eller använd e-post.')
        }
        setLoading(false)
        return
      }

      setOtpCode('')
      setView('confirm-code')
      setLoading(false)
      return
    }

    setError('Ange ett telefonnummer eller en e-postadress.')
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault()
    const code = otpCode.replace(/\s/g, '')
    if (!phoneE164 || code.length < 4) {
      setError('Ange koden vi skickade till dig.')
      return
    }

    setLoading(true)
    resetMessages()
    setIntentCookie(effectiveIntent())

    const { data, error: verifyError } = await createClient().auth.verifyOtp({
      phone: phoneE164,
      token: code,
      type: 'sms',
    })

    if (verifyError || !data.session) {
      setError('Fel kod eller utgången kod. Försök igen.')
      setLoading(false)
      return
    }

    window.location.href = postAuthHref()
  }

  async function resendPhoneOtp() {
    if (!phoneE164) return
    setLoading(true)
    resetMessages()
    const { error: otpError } = await createClient().auth.signInWithOtp({
      phone: phoneE164,
      options: {
        shouldCreateUser: true,
        data: { [AUTH_INTENT_METADATA_KEY]: effectiveIntent() },
      },
    })
    if (otpError) {
      setError('Kunde inte skicka en ny kod. Vänta en stund och försök igen.')
    } else {
      setMessage('Vi har skickat en ny kod.')
    }
    setLoading(false)
  }

  async function handleFinishSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    resetMessages()

    const first = firstName.trim()
    const last = lastName.trim()
    const normalized = email.trim().toLowerCase()

    if (!first) {
      setError('Ange ditt förnamn.')
      setLoading(false)
      return
    }
    if (!isAtLeast18(birthDate)) {
      setError('Du måste vara minst 18 år för att använda FESTEN.')
      setLoading(false)
      return
    }
    if (!isPasswordValid(password)) {
      setError('Lösenordet måste ha minst 8 tecken, versal, gemen och siffra.')
      setLoading(false)
      return
    }
    if (!passwordsMatch(password, confirmPassword)) {
      setError('Lösenorden matchar inte.')
      setLoading(false)
      return
    }

    const intent = effectiveIntent()
    setIntentCookie(intent)
    const now = new Date().toISOString()

    const { data, error: signUpError } = await createClient().auth.signUp({
      email: normalized,
      password,
      options: {
        emailRedirectTo: callbackUrl(),
        data: {
          [AUTH_INTENT_METADATA_KEY]: intent,
          [PASSWORD_SET_METADATA_KEY]: true,
          first_name: first,
          last_name: last || '',
          full_name: buildDisplayName(first, last),
          terms_accepted_at: now,
          age_confirmed_at: now,
          date_of_birth: birthDate,
        },
      },
    })

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() ?? ''
      if (msg.includes('already') || msg.includes('registered')) {
        setError('Det finns redan ett konto med den e-postadressen. Logga in istället.')
        setView('password')
      } else if (msg.includes('rate') || msg.includes('security')) {
        setError('För många försök. Vänta en stund och försök igen.')
      } else {
        setError('Kunde inte skapa kontot. Försök igen.')
      }
      setLoading(false)
      return
    }

    if (data.session?.user) {
      rememberAccount({
        email: normalized,
        name: buildDisplayName(first, last),
      })
      window.location.href = postAuthHref()
      return
    }

    rememberAccount({
      email: normalized,
      name: buildDisplayName(first, last),
    })
    setView('check-email')
    setLoading(false)
  }

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    resetMessages()
    const normalized = email.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setError('Ange en giltig e-postadress.')
      setLoading(false)
      return
    }
    if (!password) {
      setError('Ange ditt lösenord.')
      setLoading(false)
      return
    }

    setIntentCookie(effectiveIntent())
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })

    if (signInError) {
      const msg = signInError.message?.toLowerCase() ?? ''
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        setError(
          'Bekräfta din e-post via länken vi skickade innan du loggar in. Kolla även skräppost.'
        )
      } else if (msg.includes('invalid') || msg.includes('credentials')) {
        setError('Fel e-post eller lösenord. Försök igen eller återställ lösenordet.')
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

    if (data.user && data.user.user_metadata?.[PASSWORD_SET_METADATA_KEY] !== true) {
      await supabase.auth.updateUser({
        data: { [PASSWORD_SET_METADATA_KEY]: true },
      })
    }

    window.location.href = postAuthHref()
  }

  async function resendConfirmation() {
    setLoading(true)
    resetMessages()
    const normalized = email.trim().toLowerCase()
    const { error: resendError } = await createClient().auth.resend({
      type: 'signup',
      email: normalized,
      options: { emailRedirectTo: callbackUrl() },
    })
    if (resendError) {
      setError('Kunde inte skicka om bekräftelsen. Vänta en stund och försök igen.')
    } else {
      setMessage('Vi har skickat en ny bekräftelselänk.')
    }
    setLoading(false)
  }

  function pickRememberedAccount(account: RememberedAccount) {
    setEmail(account.email)
    setIdentifier(account.email)
    setPassword('')
    resetMessages()
    setView('password')
  }

  const intentHint =
    intentParam === 'provider' || defaultIntent === 'provider'
      ? 'Du är på väg att erbjuda en tjänst'
      : null

  const pwChecks = useMemo(() => getPasswordChecks(password), [password])

  if (!hydrated) {
    return <div className={cn('w-full min-h-[280px]', className)} aria-busy="true" />
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

      {error && view !== 'finish-signup' && (
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
            Välj ett konto för att fortsätta.
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
                setIdentifier('')
                setPassword('')
                resetMessages()
                setView('fresh')
              }}
              className="text-[15px] font-semibold text-foreground underline-offset-2 hover:underline"
            >
              Inte du? Använd ett annat konto
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
            {intentHint ? (
              <p className="mt-2 text-[13px] text-muted-foreground">{intentHint}</p>
            ) : null}
          </div>

          <form onSubmit={e => void handleIdentifyContinue(e)} className="flex flex-col gap-3">
            <div
              className={cn(
                'flex overflow-hidden rounded-xl border border-[#222222] bg-white transition-shadow',
                identifierFocused && 'ring-2 ring-[#222222]/15'
              )}
            >
              {showPhoneCountry && (
                <label className="relative flex shrink-0 items-stretch border-r border-[#DDDDDD] bg-[#F7F7F7]">
                  <span className="sr-only">Landskod</span>
                  <select
                    value={countryDial}
                    onChange={e => setCountryDial(e.target.value)}
                    className="appearance-none bg-transparent py-3.5 pl-3.5 pr-8 text-[15px] font-medium text-foreground outline-none"
                    aria-label="Landskod"
                  >
                    {COUNTRY_DIALS.map(c => (
                      <option key={c.code} value={c.dial}>
                        {c.dial}
                      </option>
                    ))}
                  </select>
                  <span
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  >
                    <ChevronDownIcon />
                  </span>
                </label>
              )}
              <label className="relative flex min-h-[56px] min-w-0 flex-1 flex-col justify-center px-3.5">
                <span
                  className={cn(
                    'pointer-events-none absolute left-3.5 text-muted-foreground transition-all',
                    identifier || identifierFocused
                      ? 'top-2.5 text-[11px] leading-none'
                      : 'top-1/2 -translate-y-1/2 text-[15px]'
                  )}
                >
                  {PHONE_AUTH_ENABLED ? 'Telefonnummer eller e-post' : 'E-postadress'}
                </span>
                <input
                  type={showPhoneCountry ? 'tel' : 'email'}
                  inputMode={showPhoneCountry ? 'tel' : 'email'}
                  autoComplete={showPhoneCountry ? 'tel-national' : 'email'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onFocus={() => setIdentifierFocused(true)}
                  onBlur={() => setIdentifierFocused(false)}
                  className={cn(
                    'w-full bg-transparent text-[16px] text-foreground outline-none',
                    identifier || identifierFocused ? 'mt-4 pt-0.5' : ''
                  )}
                  required
                />
              </label>
            </div>

            {identifierFocused && (
              <p className="text-[12px] leading-snug text-muted-foreground">
                {PHONE_AUTH_ENABLED ? (
                  <>
                    Vi skickar en bekräftelsekod via SMS eller e-post. Vanliga SMS-avgifter kan
                    tillkomma.{' '}
                  </>
                ) : (
                  <>Vi använder din e-post för att logga in eller skapa konto. </>
                )}
                <Link href="/privacy" className="underline underline-offset-2">
                  Integritetspolicy
                </Link>
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="mt-1 h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              {loading ? 'Kontrollerar…' : 'Fortsätt'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[12px] text-muted-foreground">eller</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            disabled={loading}
            onClick={() => void startGoogle()}
            variant="outline"
            className="h-12 w-full gap-3 rounded-xl border-[#DDDDDD] bg-white text-[16px] font-semibold text-[#222222] hover:bg-[#F7F7F7]"
          >
            <GoogleIcon />
            Fortsätt med Google
          </Button>
        </div>
      )}

      {/* Phone OTP confirm — hidden while PHONE_AUTH_ENABLED is false */}
      {PHONE_AUTH_ENABLED && view === 'confirm-code' && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              resetMessages()
              setOtpCode('')
              setView('fresh')
            }}
            className="mb-4 text-[14px] font-medium text-foreground/70 hover:text-foreground"
          >
            ← Tillbaka
          </button>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            {accountExists ? 'Välkommen tillbaka' : 'Bekräfta att det är du'}
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Ange koden vi skickade till{' '}
            <span className="font-medium text-foreground">{phoneE164}</span>
            {accountExists ? ' för att logga in.' : '.'}
          </p>

          <form onSubmit={e => void verifyPhoneOtp(e)} className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              placeholder="Bekräftelsekod"
              autoFocus
              required
              className={authInputClass}
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              {loading ? 'Verifierar…' : 'Fortsätt'}
            </Button>
          </form>

          <button
            type="button"
            disabled={loading}
            onClick={() => void resendPhoneOtp()}
            className="mt-4 w-full text-center text-[14px] font-medium text-foreground/70 underline-offset-2 hover:underline"
          >
            Skicka koden igen
          </button>
        </div>
      )}

      {view === 'password' && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              resetMessages()
              setPassword('')
              setView('fresh')
            }}
            className="mb-4 text-[14px] font-medium text-foreground/70 hover:text-foreground"
          >
            ← Tillbaka
          </button>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            Välkommen tillbaka
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Ange lösenordet för{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>

          <form onSubmit={e => void loginWithPassword(e)} className="mt-6 flex flex-col gap-4">
            <AuthPasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Lösenord"
              autoComplete="current-password"
              autoFocus
              required
            />
            <div className="text-right -mt-1">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
              >
                Glömt lösenord?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl text-[16px] font-semibold"
            >
              {loading ? 'Loggar in…' : 'Logga in'}
            </Button>
          </form>
        </div>
      )}

      {view === 'finish-signup' && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              resetMessages()
              setView('fresh')
            }}
            className="mb-4 text-[14px] font-medium text-foreground/70 hover:text-foreground"
          >
            ← Tillbaka
          </button>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            Slutför registreringen
          </h2>
          <p className="mt-2 mb-5 text-[15px] text-muted-foreground">
            <span className="font-medium text-foreground">{email}</span>
          </p>

          <FinishSignupFields
            firstName={firstName}
            lastName={lastName}
            birthDate={birthDate}
            onFirstName={setFirstName}
            onLastName={setLastName}
            onBirthDate={setBirthDate}
            showPassword
            password={password}
            confirmPassword={confirmPassword}
            onPassword={setPassword}
            onConfirmPassword={setConfirmPassword}
            passwordHint={
              <PasswordHint
                checks={pwChecks}
                match={
                  confirmPassword.length > 0
                    ? passwordsMatch(password, confirmPassword)
                    : null
                }
              />
            }
            error={error}
            loading={loading}
            onSubmit={e => void handleFinishSignup(e)}
          />
        </div>
      )}

      {view === 'check-email' && (
        <div className="pt-1 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0EB]">
            <MailIcon />
          </div>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground">
            Bekräfta din e-post
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Vi har skickat en bekräftelselänk till{' '}
            <span className="font-medium text-foreground">{email}</span>. Klicka på länken
            för att aktivera kontot, sedan kan du logga in.
          </p>

          <p className="mt-6 text-[13px] text-muted-foreground">
            Ser du inget? Kolla skräppost.
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={() => void resendConfirmation()}
            className="mt-5 text-[14px] font-semibold text-foreground underline-offset-2 hover:underline disabled:opacity-50"
          >
            {loading ? 'Skickar…' : 'Skicka länken igen'}
          </button>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                resetMessages()
                setView('fresh')
              }}
              className="text-[14px] font-medium text-foreground/70 hover:text-foreground"
            >
              ← Byt e-postadress
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordHint({
  checks,
  match,
}: {
  checks: PasswordChecks
  match: boolean | null
}) {
  const rules: { key: string; label: string; met: boolean }[] = [
    { key: 'length', label: 'Minst 8 tecken', met: checks.minLength },
    { key: 'upper', label: 'En versal (A–Z)', met: checks.hasUpper },
    { key: 'lower', label: 'En gemen (a–z)', met: checks.hasLower },
    { key: 'number', label: 'En siffra (0–9)', met: checks.hasNumber },
  ]

  if (match !== null) {
    rules.push({ key: 'match', label: 'Lösenorden matchar', met: match })
  }

  return (
    <ul className="mt-1 flex flex-col gap-1.5" aria-live="polite">
      {rules.map(rule => (
        <li
          key={rule.key}
          className={cn(
            'flex items-center gap-2 text-[13px] leading-snug',
            rule.met ? 'text-[#1D9E75]' : 'text-muted-foreground'
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full',
              rule.met ? 'bg-[#1D9E75] text-white' : 'border border-border bg-background'
            )}
            aria-hidden
          >
            {rule.met ? (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6.2 4.8 8.5 9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
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

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
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
