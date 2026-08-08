'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthPanel, { type AuthView } from '@/components/auth/AuthPanel'

/** Mirrors AuthModal DialogContent — keep in sync when modal chrome changes. */
const previewModalClass =
  'relative z-10 mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-3xl border-0 bg-white p-5 text-foreground shadow-[0_8px_28px_rgba(0,0,0,0.28)] sm:p-6'

const PREVIEW_STEPS: { id: AuthView; label: string; gated?: boolean }[] = [
  { id: 'fresh', label: 'Identify' },
  { id: 'password', label: 'Password' },
  { id: 'forgot-password', label: 'Forgot password' },
  { id: 'forgot-sent', label: 'Reset sent' },
  { id: 'finish-signup', label: 'Finish + DOB' },
  { id: 'check-email', label: 'Confirm email' },
  { id: 'welcome', label: 'Welcome back' },
  { id: 'confirm-code', label: 'SMS (gated)', gated: true },
]

export default function AuthPreviewClient() {
  const [view, setView] = useState<AuthView>('fresh')
  const [intent, setIntent] = useState<'planner' | 'provider'>('planner')
  const [panelKey, setPanelKey] = useState(0)

  function setPreview(next: AuthView) {
    setView(next)
    setPanelKey(k => k + 1)
  }

  return (
    <main className="relative min-h-screen bg-[#1a1a1a]/[0.55] px-4 py-6 sm:py-10">
      <div className="relative z-10 mx-auto mb-6 max-w-lg text-center sm:mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#FF2E8A]">
          Local preview
        </p>
        <h1 className="mt-1 text-[22px] font-semibold text-white">Auth modal</h1>
        <p className="mt-1 text-[13px] text-white/70">
          Matches production: email-only identify, finish signup with calendar födelsedatum +
          password checklist. Tip: <span className="text-white">demo@…</span> → Password; any
          other email → Finish signup. SMS is gated off in app code.
        </p>
        <p className="mt-2 text-[13px] text-white/70">
          <Link href="/dev/onboarding" className="underline underline-offset-2">
            All flows
          </Link>
          {' · '}
          <Link href="/dev/onboarding/complete-signup" className="underline underline-offset-2">
            Google finish signup
          </Link>
          {' · '}
          <Link href="/dev/onboarding/set-password" className="underline underline-offset-2">
            Set password
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PREVIEW_STEPS.map(({ id, label, gated }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreview(id)}
              className={`rounded-full border px-3 py-1.5 text-[13px] font-medium ${
                view === id
                  ? 'border-white bg-white text-[#222222]'
                  : gated
                    ? 'border-white/20 bg-transparent text-white/45'
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

      <div className={previewModalClass}>
        <AuthPanel
          key={`${panelKey}-${view}-${intent}`}
          intent={intent}
          next={intent === 'provider' ? '/onboarding' : '/'}
          initialView={view}
          previewMode
          showClose
          onClose={() => undefined}
        />
      </div>
    </main>
  )
}
