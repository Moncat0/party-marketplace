'use client'

import { cn } from '@/lib/utils'
import type { PasswordChecks } from '@/lib/auth-compliance'

type Props = {
  checks: PasswordChecks
  /** Always passed so the “match” row is reserved from first paint (avoids mid-step height jump). */
  match: boolean
  className?: string
}

/** Shared password rules checklist used in signup, set-password, and reset-password. */
export default function PasswordHint({ checks, match, className }: Props) {
  const rules: { key: string; label: string; met: boolean }[] = [
    { key: 'length', label: 'Minst 8 tecken', met: checks.minLength },
    { key: 'upper', label: 'En versal (A–Z)', met: checks.hasUpper },
    { key: 'lower', label: 'En gemen (a–z)', met: checks.hasLower },
    { key: 'number', label: 'En siffra (0–9)', met: checks.hasNumber },
    { key: 'match', label: 'Lösenorden matchar', met: match },
  ]

  return (
    <ul
      className={cn('mt-0.5 grid grid-cols-2 gap-x-2 gap-y-1', className)}
      aria-live="polite"
    >
      {rules.map(rule => (
        <li
          key={rule.key}
          className={cn(
            'flex items-center gap-1.5 text-[12px] leading-tight',
            rule.key === 'match' && 'col-span-2',
            rule.met ? 'text-[#1D9E75]' : 'text-muted-foreground'
          )}
        >
          <span
            className={cn(
              'flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full',
              rule.met ? 'bg-[#1D9E75] text-white' : 'border border-border bg-background'
            )}
            aria-hidden
          >
            {rule.met ? (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
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
