'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import AuthPasswordInput, { authInputClass } from '@/components/auth/AuthPasswordInput'

export { authInputClass }

const finishInputClass = cn(authInputClass, 'h-11')

/** Airbnb-style legal copy above “Godkänn och fortsätt” — no checkboxes. */
export function AgreeAndContinueLegal() {
  return (
    <p className="text-[11px] leading-snug text-muted-foreground">
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
    <form onSubmit={onSubmit} className={cn('flex flex-col gap-2.5', className)}>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="finish-first" className="mb-1 block text-[12px] font-medium text-foreground">
            Förnamn
          </label>
          <input
            id="finish-first"
            value={firstName}
            onChange={e => onFirstName(e.target.value)}
            autoComplete="given-name"
            required
            className={finishInputClass}
          />
        </div>
        <div>
          <label htmlFor="finish-last" className="mb-1 block text-[12px] font-medium text-foreground">
            Efternamn
          </label>
          <input
            id="finish-last"
            value={lastName}
            onChange={e => onLastName(e.target.value)}
            autoComplete="family-name"
            className={finishInputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="finish-birth" className="mb-1 block text-[12px] font-medium text-foreground">
          Födelsedatum
        </label>
        <input
          id="finish-birth"
          type="date"
          value={birthDate}
          onChange={e => onBirthDate(e.target.value)}
          required
          max={new Date().toISOString().slice(0, 10)}
          className={finishInputClass}
        />
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Minst 18 år. Visas inte publikt.
        </p>
      </div>

      {showPassword && (
        <>
          <div>
            <label htmlFor="finish-password" className="mb-1 block text-[12px] font-medium text-foreground">
              Lösenord
            </label>
            <AuthPasswordInput
              id="finish-password"
              value={password}
              onChange={e => onPassword?.(e.target.value)}
              autoComplete="new-password"
              required
              className="h-11"
            />
          </div>
          <div>
            <label htmlFor="finish-confirm" className="mb-1 block text-[12px] font-medium text-foreground">
              Bekräfta lösenord
            </label>
            <AuthPasswordInput
              id="finish-confirm"
              value={confirmPassword}
              onChange={e => onConfirmPassword?.(e.target.value)}
              autoComplete="new-password"
              required
              className="h-11"
            />
          </div>
          {passwordHint}
        </>
      )}

      {error && (
        <div className="rounded-xl border border-[#f5c6c0] bg-[#fff5f3] px-3 py-2.5 text-[13px] text-[#C13515]">
          {error}
        </div>
      )}

      <AgreeAndContinueLegal />

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl text-[15px] font-semibold"
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
