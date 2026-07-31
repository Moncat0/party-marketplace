'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthPanel, { type AuthView } from '@/components/auth/AuthPanel'

export default function AuthPreviewClient() {
  const [view, setView] = useState<AuthView>('fresh')
  const [intent, setIntent] = useState<'planner' | 'provider'>('planner')
  const [panelKey, setPanelKey] = useState(0)

  function setPreview(next: AuthView) {
    setView(next)
    setPanelKey(k => k + 1)
  }

  return (
    <main className="relative min-h-screen bg-[#1a1a1a]/[0.55] px-4 py-10">
      <div className="relative z-10 mx-auto mb-8 max-w-lg text-center">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#FF6B35]">
          Local preview
        </p>
        <h1 className="mt-1 text-[22px] font-semibold text-white">Auth modal (Airbnb-style)</h1>
        <p className="mt-1 text-[13px] text-white/70">
          Email + Google for now (phone OTP gated off).{' '}
          <Link href="/dev/onboarding" className="underline underline-offset-2">
            All flows
          </Link>
          {' · '}
          <Link href="/dev/onboarding/complete-signup" className="underline underline-offset-2">
            Finish signup (Google)
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {(
            [
              ['fresh', 'Identify'],
              ['confirm-code', 'SMS code'],
              ['password', 'Password'],
              ['finish-signup', 'Finish signup'],
              ['welcome', 'Welcome back'],
              ['check-email', 'Confirm email'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreview(id)}
              className={`rounded-full border px-3 py-1.5 text-[13px] font-medium ${
                view === id
                  ? 'border-white bg-white text-[#222222]'
                  : 'border-white/30 bg-transparent text-white'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIntent(m => (m === 'planner' ? 'provider' : 'planner'))
              setPanelKey(k => k + 1)
            }}
            className="rounded-full border border-white/30 bg-transparent px-3 py-1.5 text-[13px] font-medium text-white"
          >
            Intent: {intent}
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-h-[min(96dvh,820px)] w-full max-w-[440px] overflow-y-auto rounded-3xl border-0 bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.28)] sm:p-8">
        <AuthPanel
          key={`${panelKey}-${view}-${intent}`}
          intent={intent}
          next={intent === 'provider' ? '/onboarding' : '/'}
          initialView={view}
          showClose
          onClose={() => undefined}
        />
      </div>
    </main>
  )
}
