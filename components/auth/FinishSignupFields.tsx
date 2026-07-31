'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const authInputClass =
  'h-14 w-full rounded-xl border border-border bg-background px-4 text-[16px] leading-none text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground'

/** Airbnb-style legal copy above “Godkänn och fortsätt” — no checkboxes. */
export function AgreeAndContinueLegal() {
  return (
    <p className="text-[12px] leading-relaxed text-muted-foreground">
      Genom att välja <span className="font-medium text-foreground">Godkänn och fortsätt</span>{' '}
      godkänner du FESTEN:s{' '}
      <Link href="/terms" target="_blank" className="font-medium text-foreground underline underline-offset-2">
        användarvillkor
      </Link>{' '}
      och{' '}
      <Link href="/privacy" target="_blank" className="font-medium text-foreground underline underline-offset-2">
        integritetspolicy
      </Link>
      , och bekräftar att du är minst 18 år.
    </p>
  )
}

type FinishSignupFieldsProps = {
  firstName: string
  lastName: string
  birthDate: string
  onFirstName: (v: string) => void
  onLastName: (v: string) => void
  onBirthDate: (v: string) => void
  /** Email path needs passwords; Google path does not */
  showPassword?: boolean
  password?: string
  confirmPassword?: string
  onPassword?: (v: string) => void
  onConfirmPassword?: (v: string) => void
  passwordHint?: React.ReactNode
  error?: string | null
  loading?: boolean
  submitLabel?: string
  onSubmit: (e: React.FormEvent) => void
  className?: string
}

/**
 * Airbnb “Finish signing up” step — name, birthday, optional password,
 * then Agree and continue (terms accepted by clicking the button).
 */
export default function FinishSignupFields({
  firstName,
  lastName,
  birthDate,
  onFirstName,
  onLastName,
  onBirthDate,
  showPassword = false,
  password = '',
  confirmPassword = '',
  onPassword,
  onConfirmPassword,
  passwordHint,
  error,
  loading,
  submitLabel = 'Godkänn och fortsätt',
  onSubmit,
  className,
}: FinishSignupFieldsProps) {
  return (
    <form onSubmit={onSubmit} className={cn('flex flex-col gap-3', className)}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="finish-first" className="mb-1.5 block text-[13px] font-medium text-foreground">
            Förnamn
          </label>
          <input
            id="finish-first"
            value={firstName}
            onChange={e => onFirstName(e.target.value)}
            autoComplete="given-name"
            required
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="finish-last" className="mb-1.5 block text-[13px] font-medium text-foreground">
            Efternamn
          </label>
          <input
            id="finish-last"
            value={lastName}
            onChange={e => onLastName(e.target.value)}
            autoComplete="family-name"
            className={authInputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="finish-birth" className="mb-1.5 block text-[13px] font-medium text-foreground">
          Födelsedatum
        </label>
        <input
          id="finish-birth"
          type="date"
          value={birthDate}
          onChange={e => onBirthDate(e.target.value)}
          required
          max={new Date().toISOString().slice(0, 10)}
          className={authInputClass}
        />
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Du måste vara minst 18 år. Vi visar inte ditt födelsedatum publikt.
        </p>
      </div>

      {showPassword && (
        <>
          <div>
            <label htmlFor="finish-password" className="mb-1.5 block text-[13px] font-medium text-foreground">
              Lösenord
            </label>
            <input
              id="finish-password"
              type="password"
              value={password}
              onChange={e => onPassword?.(e.target.value)}
              autoComplete="new-password"
              required
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="finish-confirm" className="mb-1.5 block text-[13px] font-medium text-foreground">
              Bekräfta lösenord
            </label>
            <input
              id="finish-confirm"
              type="password"
              value={confirmPassword}
              onChange={e => onConfirmPassword?.(e.target.value)}
              autoComplete="new-password"
              required
              className={authInputClass}
            />
          </div>
          {passwordHint}
        </>
      )}

      {error && (
        <div className="rounded-xl border border-[#f5c6c0] bg-[#fff5f3] px-4 py-3 text-[14px] text-[#C13515]">
          {error}
        </div>
      )}

      <AgreeAndContinueLegal />

      <Button
        type="submit"
        disabled={loading}
        className="mt-1 h-12 w-full rounded-xl text-[16px] font-semibold"
      >
        {loading ? 'Sparar…' : submitLabel}
      </Button>
    </form>
  )
}

/** Returns true if YYYY-MM-DD is at least 18 years ago. */
export function isAtLeast18(birthDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false
  const born = new Date(`${birthDate}T12:00:00`)
  if (Number.isNaN(born.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const m = today.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age -= 1
  return age >= 18
}
