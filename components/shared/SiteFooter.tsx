'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { HOME_SHELL } from '@/components/listings/ListingRow'
import { openAuth } from '@/lib/open-auth'

type Props = {
  isLoggedIn?: boolean
}

function InviteFooterForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Något gick fel. Försök igen.')
    }
    setSending(false)
  }

  if (done) return <p className="text-sm text-[#FF6B35] font-medium">Inbjudan skickad!</p>

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="deras@email.se"
        required
        className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!email.trim() || sending}
        className="whitespace-nowrap rounded-xl"
      >
        {sending ? '...' : 'Bjud in'}
      </Button>
      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
    </form>
  )
}

/** Shared marketplace footer (homepage + listing pages). */
export default function SiteFooter({ isLoggedIn = false }: Props) {
  return (
    <footer className="bg-[#222222] mt-8">
      <div className={`${HOME_SHELL} py-14`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2">
            <p className="text-xl font-bold text-[#FF6B35] mb-3">FESTEN.</p>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Marknadsplatsen för festunderhållning i Stockholm. Här bokar du DJ:s, fotografer,
              sminkartister och mer till ditt nästa kalas.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mt-3 max-w-xs">
              Har du en talang?{' '}
              {isLoggedIn ? (
                <Link
                  href="/onboarding"
                  className="text-[#FF6B35] hover:underline font-medium"
                >
                  Erbjud din tjänst
                </Link>
              ) : (
                <Link
                  href="/for-talanger"
                  className="text-[#FF6B35] hover:underline font-medium"
                >
                  Erbjud din tjänst
                </Link>
              )}{' '}
              och nå fler kunder — helt gratis att komma igång.
            </p>

            {isLoggedIn && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-white mb-1">
                  Känner du någon som borde vara här?
                </p>
                <p className="text-xs text-white/50 mb-3">
                  Bjud in en artist, fotograf eller kock till FESTEN.
                </p>
                <InviteFooterForm />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
              Kategorier
            </p>
            <ul className="space-y-3">
              {CATEGORIES.slice(0, 4).map(c => (
                <li key={c.slug}>
                  <Link
                    href={`/kategori/${c.slug}`}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
              &nbsp;
            </p>
            <ul className="space-y-3">
              {CATEGORIES.slice(4).map(c => (
                <li key={c.slug}>
                  <Link
                    href={`/kategori/${c.slug}`}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
              Info
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/sa-funkar-det"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Så funkar det
                </Link>
              </li>
              <li>
                <Link
                  href="/for-talanger"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  För talanger
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openAuth({ intent: 'planner', next: '/', mode: 'login' })}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Logga in
                </button>
              </li>
              <li>
                <Link
                  href="/hjalp"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Hjälpcenter
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Användarvillkor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/30">© 2026 FESTEN. Stockholm</p>
          <p className="text-xs text-white/30">Gjord med kärlek för kalas 🎉</p>
        </div>
      </div>
    </footer>
  )
}
