'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Role = 'planner' | 'provider'

function SignupForm() {
  const searchParams = useSearchParams()
  // If ?next is set it means they came from a "Book" or "Save" action → planner intent
  const next = searchParams.get('next')
  const impliedRole: Role | null = next ? 'planner' : null

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [role, setRole] = useState<Role | null>(impliedRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function destinationAfterAuth(): string {
    if (mode === 'login') {
      // Honour an explicit next param; otherwise let /dashboard auto-route based on role
      return next ?? '/dashboard'
    }
    // Signup
    if (role === 'provider') return '/onboarding'
    return next ?? '/planner/dashboard'
  }

  function callbackUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/auth/callback?next=${encodeURIComponent(destinationAfterAuth())}`
  }

  function reset() {
    setEmail(''); setPassword(''); setError(null); setMessage(null)
  }

  async function handleGoogleLogin() {
    setLoading(true); setError(null)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
    if (error) setError('Det gick inte att logga in med Google. Försök igen.')
    setLoading(false)
  }

  async function handleFacebookLogin() {
    setLoading(true); setError(null)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: callbackUrl() },
    })
    if (error) setError('Det gick inte att logga in med Facebook. Försök igen.')
    setLoading(false)
  }

  async function handleAppleLogin() {
    setLoading(true); setError(null)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: callbackUrl() },
    })
    if (error) setError('Det gick inte att logga in med Apple. Försök igen.')
    setLoading(false)
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl() },
      })
      if (error) {
        setError('Det gick inte att skapa kontot. Kontrollera din e-post och ditt lösenord.')
      } else {
        setMessage('Vi har skickat en bekräftelse till din e-post. Kolla inkorgen!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Fel e-post eller lösenord. Försök igen.')
      } else {
        window.location.href = destinationAfterAuth()
      }
    }

    setLoading(false)
  }

  // ------------------------------------------------------------------
  // Signup: show role picker before the form if no role chosen yet
  // ------------------------------------------------------------------
  const showRolePicker = mode === 'signup' && role === null

  return (
    <main className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold tracking-tight text-[#1A1A2E]">FESTEN.</a>
          <p className="mt-2 text-[#5F5E5A] text-sm">
            {mode === 'login' ? 'Logga in på ditt konto' : 'Skapa ett konto'}
          </p>
        </div>

        {/* Error / success */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-[#1D9E75]">{message}</div>
        )}

        {/* ── ROLE PICKER (signup only, before form) ── */}
        {showRolePicker ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1A1A2E] mb-4 text-center">
              Hur vill du använda FESTEN.?
            </p>

            <button
              onClick={() => setRole('planner')}
              className="w-full flex items-start gap-4 rounded-2xl border-2 border-[#E8E3DC] bg-white px-5 py-4 text-left hover:border-[#FF6B35] hover:bg-[#FFF8F3] transition-all"
            >
              <span className="text-2xl mt-0.5">🎉</span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Jag planerar ett kalas</p>
                <p className="text-xs text-[#5F5E5A] mt-0.5">Hitta och boka lokala talanger till ditt event</p>
              </div>
            </button>

            <button
              onClick={() => setRole('provider')}
              className="w-full flex items-start gap-4 rounded-2xl border-2 border-[#E8E3DC] bg-white px-5 py-4 text-left hover:border-[#FF6B35] hover:bg-[#FFF8F3] transition-all"
            >
              <span className="text-2xl mt-0.5">🎤</span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Jag erbjuder en tjänst</p>
                <p className="text-xs text-[#5F5E5A] mt-0.5">Skapa en profil och bli hittad av arrangörer</p>
              </div>
            </button>

            <p className="pt-2 text-center text-sm text-[#5F5E5A]">
              Har du redan ett konto?{' '}
              <button
                onClick={() => { setMode('login'); reset() }}
                className="font-medium text-[#FF6B35] hover:underline"
              >
                Logga in
              </button>
            </p>
          </div>

        ) : (
          /* ── LOGIN / SIGNUP FORM ── */
          <>
            {/* Role badge (signup only) */}
            {mode === 'signup' && role && (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-[#F0EDE8] px-4 py-2.5">
                <span className="text-sm text-[#1A1A2E]">
                  {role === 'planner' ? '🎉 Planerare' : '🎤 Talang / tjänsteleverantör'}
                </span>
                <button
                  onClick={() => setRole(null)}
                  className="text-xs text-[#FF6B35] hover:underline"
                >
                  Ändra
                </button>
              </div>
            )}

            {/* Social buttons */}
            <div className="space-y-3">
              <button onClick={handleGoogleLogin} disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm font-medium text-[#1A1A2E] hover:bg-[#F0EDE8] transition-colors disabled:opacity-50">
                <GoogleIcon />
                {mode === 'signup' ? 'Registrera med Google' : 'Fortsätt med Google'}
              </button>
              <button onClick={handleFacebookLogin} disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm font-medium text-[#1A1A2E] hover:bg-[#F0EDE8] transition-colors disabled:opacity-50">
                <FacebookIcon />
                {mode === 'signup' ? 'Registrera med Facebook' : 'Fortsätt med Facebook'}
              </button>
              <button onClick={handleAppleLogin} disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm font-medium text-[#1A1A2E] hover:bg-[#F0EDE8] transition-colors disabled:opacity-50">
                <AppleIcon />
                {mode === 'signup' ? 'Registrera med Apple' : 'Fortsätt med Apple'}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E8E3DC]" />
              <span className="text-xs text-[#5F5E5A]">eller</span>
              <div className="flex-1 h-px bg-[#E8E3DC]" />
            </div>

            {/* Email / password */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">E-postadress</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="din@epost.se"
                  className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[#1A1A2E]">Lösenord</label>
                  {mode === 'login' && (
                    <a href="/forgot-password" className="text-xs text-[#FF6B35] hover:underline">Glömt lösenordet?</a>
                  )}
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minst 8 tecken"
                  className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-50">
                {loading ? 'Laddar...' : mode === 'signup' ? 'Skapa konto' : 'Logga in'}
              </button>
            </form>

            {/* Toggle */}
            <p className="mt-6 text-center text-sm text-[#5F5E5A]">
              {mode === 'signup' ? 'Har du redan ett konto?' : 'Har du inget konto?'}{' '}
              <button
                onClick={() => {
                  if (mode === 'login') { setMode('signup'); setRole(impliedRole) }
                  else { setMode('login'); reset() }
                }}
                className="font-medium text-[#FF6B35] hover:underline"
              >
                {mode === 'signup' ? 'Logga in' : 'Registrera dig'}
              </button>
            </p>
          </>
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
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A2E">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  )
}
