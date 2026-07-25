'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.')
      return
    }
    if (password !== confirm) {
      setError('Lösenorden matchar inte.')
      return
    }

    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password })
    if (error) {
      setError('Något gick fel. Länken kan ha gått ut — begär en ny återställningslänk.')
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
          <p className="mt-2 text-sm text-[#5F5E5A]">Välj ett nytt lösenord</p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Lösenord uppdaterat!</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">
              Ditt lösenord är nu ändrat. Du kan logga in med det nya lösenordet.
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl bg-[#FF6B35] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
            >
              Gå till startsidan
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}{' '}
                {error.includes('gått ut') && (
                  <Link href="/forgot-password" className="font-medium underline">
                    Begär ny länk
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
                  Nytt lösenord
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minst 8 tecken"
                  className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
                  Bekräfta lösenord
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Upprepa lösenordet"
                  className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={!password || !confirm || loading}
                className="w-full rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sparar...' : 'Spara nytt lösenord'}
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  )
}
