'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

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

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : '/auth/callback?next=/reset-password'

    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (error) {
      setError('Något gick fel. Kontrollera att e-postadressen stämmer och försök igen.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A2E]">FESTEN.</h1>
          <p className="mt-2 text-sm text-[#5F5E5A]">Återställ ditt lösenord</p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
            <p className="text-4xl mb-4">📬</p>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Kolla din inkorg!</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">
              Vi har skickat en återställningslänk till <span className="font-medium text-[#1A1A2E]">{email}</span>.
              Länken är giltig i 60 minuter.
            </p>
            <Link
              href="/signup"
              className="text-sm font-medium text-[#FF6B35] hover:underline"
            >
              Tillbaka till inloggning
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-[#5F5E5A] mb-5">
                Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
              </p>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
                    E-postadress
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="din@epost.se"
                    className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Skickar...' : 'Skicka återställningslänk'}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-[#5F5E5A]">
              Kom du ihåg lösenordet?{' '}
              <Link href="/signup" className="font-medium text-[#FF6B35] hover:underline">
                Logga in
              </Link>
            </p>
          </>
        )}

      </div>
    </main>
  )
}
