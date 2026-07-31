'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  namesFromAuthUser,
  parseCompleteSignupNext,
} from '@/lib/auth-compliance'
import { buildDisplayName } from '@/lib/profile-completeness'
import FinishSignupFields, { isAtLeast18 } from '@/components/auth/FinishSignupFields'

/**
 * Airbnb-style post-OAuth step for new Google users:
 * name (prefilled) + birthday + “Godkänn och fortsätt” (terms + 18+).
 */
export default function CompleteSignupClient({
  previewMode = false,
}: {
  previewMode?: boolean
} = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = parseCompleteSignupNext(searchParams.get('next')) ?? '/'

  const [checking, setChecking] = useState(!previewMode)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (previewMode) {
      setFirstName('Anna')
      setLastName('Andersson')
      // Simulate Google People API birthday prefill when available
      setBirthDate('1994-03-12')
      setChecking(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/?auth=1&next=${encodeURIComponent('/complete-signup')}`)
        return
      }

      const { data: row } = await supabase
        .from('users')
        .select('first_name, last_name, terms_accepted_at, age_confirmed_at')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (row?.terms_accepted_at && row?.age_confirmed_at) {
        router.replace(nextPath)
        return
      }

      const names = namesFromAuthUser(user)
      setFirstName(row?.first_name?.trim() || names.firstName)
      setLastName(row?.last_name?.trim() || names.lastName)
      const metaDob = user.user_metadata?.date_of_birth
      if (typeof metaDob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(metaDob)) {
        setBirthDate(metaDob)
      }
      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router, nextPath, previewMode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (previewMode) {
      setError('Preview only — sparas inte här.')
      return
    }

    const first = firstName.trim()
    if (!first) {
      setError('Ange ditt förnamn.')
      return
    }
    if (!isAtLeast18(birthDate)) {
      setError('Du måste vara minst 18 år för att använda FESTEN.')
      return
    }

    setLoading(true)
    setError(null)
    const now = new Date().toISOString()
    const last = lastName.trim()
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Du behöver vara inloggad.')
      setLoading(false)
      return
    }

    await supabase.auth.updateUser({
      data: {
        first_name: first,
        last_name: last,
        full_name: buildDisplayName(first, last),
        terms_accepted_at: now,
        age_confirmed_at: now,
        date_of_birth: birthDate,
      },
    })

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: first,
        last_name: last || null,
        preferred_first_name: first,
        name: buildDisplayName(first, last),
        terms_accepted_at: now,
        age_confirmed_at: now,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Kunde inte spara. Försök igen.')
      setLoading(false)
      return
    }

    router.replace(nextPath)
  }

  if (checking) {
    return (
      <main className="flex h-dvh items-center justify-center bg-white px-4">
        <p className="text-[14px] text-[#6a6a6a]">Laddar…</p>
      </main>
    )
  }

  return (
    <main className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-[28px] font-bold tracking-tight text-[#FF6B35]">
              FESTEN.
            </Link>
            <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-[#222222]">
              Slutför registreringen
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6a6a6a]">
              Ett sista steg innan du är igång.
            </p>
          </div>

          <FinishSignupFields
            firstName={firstName}
            lastName={lastName}
            birthDate={birthDate}
            onFirstName={setFirstName}
            onLastName={setLastName}
            onBirthDate={setBirthDate}
            showPassword={false}
            error={error}
            loading={loading}
            onSubmit={e => void handleSubmit(e)}
          />
        </div>
      </div>
    </main>
  )
}
