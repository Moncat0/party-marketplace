'use client'

import { type FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'
import {
  buildDisplayName,
  needsDisplayName,
  parseWelcomeNext,
} from '@/lib/profile-completeness'
import { siteChromePad, siteHeaderRow, siteLogoClass } from '@/components/siteChrome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function WelcomeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = parseWelcomeNext(searchParams.get('next')) ?? '/planner/dashboard'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/?auth=1&next=${encodeURIComponent('/welcome')}`)
        return
      }
      const { data: row } = await supabase
        .from('users')
        .select('name, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (!needsDisplayName(row)) {
        router.replace(next)
        return
      }

      if (row?.first_name) setFirstName(row.first_name)
      else if (row?.name) {
        const parts = row.name.trim().split(/\s+/)
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
      }
      if (row?.last_name) setLastName(row.last_name)
      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router, next])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const first = firstName.trim()
    if (!first) {
      setError('Ange ditt förnamn så vi vet vad vi ska kalla dig.')
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Du behöver vara inloggad.')
      setLoading(false)
      return
    }

    const last = lastName.trim()
    const fullName = buildDisplayName(first, last)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: first,
        last_name: last || null,
        name: fullName,
        preferred_first_name: first,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Kunde inte spara. Försök igen.')
      setLoading(false)
      return
    }

    track('profile_details_completed', { fields: ['name'] })
    router.replace(next)
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">Laddar…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-foreground leading-tight">
          Vad heter du?
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Så här syns du för andra på FESTEN. — till exempel när du skickar en
          bokningsförfrågan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">Förnamn</Label>
            <Input
              id="first-name"
              name="given-name"
              autoComplete="given-name"
              autoFocus
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Anna"
              className="h-14 rounded-xl text-[16px]"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">
              Efternamn <span className="font-normal text-muted-foreground">(valfritt)</span>
            </Label>
            <Input
              id="last-name"
              name="family-name"
              autoComplete="family-name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Andersson"
              className="h-14 rounded-xl text-[16px]"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full rounded-xl text-base font-semibold"
            disabled={loading}
          >
            {loading ? 'Sparar…' : 'Fortsätt'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background">
        <div className={siteChromePad}>
          <div className={siteHeaderRow}>
            <Link href="/" className={siteLogoClass}>
              FESTEN.
            </Link>
          </div>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center px-4 py-16">
            <p className="text-sm text-muted-foreground">Laddar…</p>
          </div>
        }
      >
        <WelcomeForm />
      </Suspense>
    </div>
  )
}
