'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import SettingsButton from './SettingsButton'
import AddPaymentMethodModal from './AddPaymentMethodModal'
import { settingsTokens as t } from './tokens'

type Tab = 'payments' | 'payouts'

type SavedMethod = {
  id: string
  brand: string
  last4: string
  expMonth: number | null
  expYear: number | null
}

type Props = {
  role: 'planner' | 'provider'
  paymentsHref: string
  firstName?: string
  lastName?: string
  stripeOnboarded?: boolean
}

function HelpLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 py-4 text-[16px] font-medium text-[#222222] underline underline-offset-[3px] hover:text-[#6a6a6a]"
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

export default function PaymentsSettings({
  role,
  paymentsHref,
  firstName = '',
  lastName = '',
  stripeOnboarded = false,
}: Props) {
  const [tab, setTab] = useState<Tab>(role === 'provider' ? 'payouts' : 'payments')
  const [cardOpen, setCardOpen] = useState(false)
  const [methods, setMethods] = useState<SavedMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(false)

  const loadMethods = useCallback(async () => {
    setLoadingMethods(true)
    try {
      const res = await fetch('/api/payments/methods')
      if (res.ok) {
        const json = (await res.json()) as { methods: SavedMethod[] }
        setMethods(json.methods ?? [])
      }
    } finally {
      setLoadingMethods(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'payments') void loadMethods()
  }, [tab, loadMethods])

  return (
    <>
      <h2 className="mb-6 text-[26px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] md:text-[32px]">
        Betalningar
      </h2>

      <div
        className="flex gap-8"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        {(
          [
            { id: 'payments' as const, label: 'Betalningar' },
            { id: 'payouts' as const, label: 'Utbetalningar' },
          ] as const
        ).map(item => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="relative pb-4 text-[16px] transition-colors"
              style={{
                fontWeight: active ? 600 : 400,
                color: active ? '#222222' : '#6a6a6a',
              }}
            >
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222]" aria-hidden />
              )}
            </button>
          )
        })}
      </div>

      {tab === 'payments' && (
        <div>
          <section
            style={{
              borderBottom: `1px solid ${t.colors.hairlineSoft}`,
              paddingTop: 40,
              paddingBottom: 40,
            }}
          >
            <h3 className="text-[18px] font-semibold text-[#222222]">Dina betalningar</h3>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.43] text-[#6a6a6a]">
              Håll koll på alla dina betalningar och återbetalningar.
            </p>
            <div className="mt-5">
              <Link
                href={paymentsHref}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#222222] px-6 text-[16px] font-medium text-white hover:bg-[#000]"
              >
                Hantera betalningar
              </Link>
            </div>
          </section>

          <section
            style={{
              borderBottom: `1px solid ${t.colors.hairlineSoft}`,
              paddingTop: 40,
              paddingBottom: 40,
            }}
          >
            <h3 className="text-[18px] font-semibold text-[#222222]">Betalningsmetoder</h3>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.43] text-[#6a6a6a]">
              Lägg till en betalningsmetod via vårt säkra betalsystem, och boka sedan din nästa
              fest.
            </p>
            {methods.length > 0 && (
              <ul className="mt-4 space-y-2">
                {methods.map(m => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-[14px] text-[#222222]"
                    style={{ border: `1px solid ${t.colors.hairlineSoft}` }}
                  >
                    <span className="capitalize">
                      {m.brand} •••• {m.last4}
                    </span>
                    {m.expMonth && m.expYear && (
                      <span className="text-[#6a6a6a]">
                        {String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {loadingMethods && (
              <p className="mt-3 text-[13px] text-[#6a6a6a]">Hämtar sparade kort…</p>
            )}
            <div className="mt-5">
              <SettingsButton
                variant="dark"
                className="h-12 rounded-lg px-6"
                onClick={() => setCardOpen(true)}
              >
                Lägg till betalningsmetod
              </SettingsButton>
            </div>
          </section>

          <div
            className="mt-10 flex gap-4 rounded-xl p-5"
            style={{
              backgroundColor: t.colors.surfaceSoft,
              border: `1px solid ${t.colors.hairlineSoft}`,
            }}
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#FFE8E0' }}
              aria-hidden
            >
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="12" width="28" height="18" rx="3" stroke="#FF6B35" strokeWidth="1.75" />
                <path d="M6 18h28" stroke="#FF6B35" strokeWidth="1.75" />
                <path
                  d="M20 22c1.5 0 2.5 1 2.5 2.2 0 1.8-2.5 3.3-2.5 3.3s-2.5-1.5-2.5-3.3c0-1.2 1-2.2 2.5-2.2z"
                  stroke="#FF6B35"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-[#222222]">
                Betala alltid via FESTEN.
              </p>
              <p className="mt-1 text-[14px] leading-[1.43] text-[#6a6a6a]">
                Betala och kommunicera alltid via FESTEN. så att du skyddas av våra{' '}
                <Link href="/terms" className="underline text-[#222222]">
                  användarvillkor
                </Link>
                ,{' '}
                <Link href="/privacy" className="underline text-[#222222]">
                  betalningsvillkor
                </Link>
                , avbokningsregler och andra skyddsåtgärder.{' '}
                <Link href="/privacy" className="underline text-[#222222]">
                  Läs mer
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'payouts' && (
        <div>
          <section className="pt-10 pb-10">
            <h3 className="text-[18px] font-semibold text-[#222222]">Hur du får betalt</h3>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.43] text-[#6a6a6a]">
              {role === 'provider'
                ? 'Lägg till minst en utbetalningsmetod så vi vet vart vi ska skicka dina pengar.'
                : 'Utbetalningar gäller dig som talang. Bli talang och koppla Stripe för att ta emot betalningar.'}
            </p>
            {role === 'provider' && (
              <div className="mt-5">
                {stripeOnboarded ? (
                  <p className="text-[14px] font-medium text-[#1D9E75]">
                    Utbetalningar är kopplade via Stripe.
                  </p>
                ) : null}
                <a
                  href="/api/stripe/connect"
                  className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-[#222222] px-6 text-[16px] font-medium text-white hover:bg-[#000]"
                >
                  {stripeOnboarded ? 'Hantera utbetalningar' : 'Konfigurera utbetalningar'}
                </a>
              </div>
            )}
            {role === 'planner' && (
              <div className="mt-5">
                <Link
                  href="/signup?intent=provider&next=/onboarding"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-[#222222] px-6 text-[16px] font-medium text-white hover:bg-[#000]"
                >
                  Bli talang
                </Link>
              </div>
            )}
          </section>

          <div
            className="mt-2 rounded-xl px-5"
            style={{ border: `1px solid ${t.colors.hairlineSoft}` }}
          >
            <p className="pt-5 text-[16px] font-semibold text-[#222222]">Behöver du hjälp?</p>
            <div className="divide-y" style={{ borderColor: t.colors.hairlineSoft }}>
              <HelpLink href="/privacy" label="När får du din utbetalning" />
              <HelpLink href="/privacy" label="Hur utbetalningar fungerar" />
              <HelpLink href={paymentsHref} label="Gå till din transaktionshistorik" />
            </div>
          </div>
        </div>
      )}

      <AddPaymentMethodModal
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        onSaved={() => void loadMethods()}
        defaultFirstName={firstName}
        defaultLastName={lastName}
      />
    </>
  )
}
