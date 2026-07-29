'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'
import {
  buildDisplayName,
  isProviderDestination,
  needsDisplayName,
} from '@/lib/profile-completeness'
import ServiceWizardChrome from '@/components/service-wizard/ServiceWizardChrome'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Step = 'name' | 'bio'

type Props = {
  /** Where to go after the wizard finishes */
  nextPath: string
}

/**
 * Full-screen account onboarding — same chrome as create-listing.
 * Planner: name only. Provider: name + optional short bio (shown on listings).
 */
export default function AccountOnboarding({ nextPath }: Props) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [asProvider, setAsProvider] = useState(false)
  const [step, setStep] = useState<Step>('name')
  /** True when name was already complete and we opened on bio only */
  const [nameAlreadyDone, setNameAlreadyDone] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
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

      const [{ data: row }, { data: profile }] = await Promise.all([
        supabase
          .from('users')
          .select('name, first_name, last_name, user_type')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('provider_profiles')
          .select('bio')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      if (cancelled) return

      const providerSide =
        row?.user_type === 'provider' ||
        row?.user_type === 'both' ||
        isProviderDestination(nextPath)

      setAsProvider(providerSide)

      if (!needsDisplayName(row)) {
        if (!providerSide) {
          router.replace(nextPath)
          return
        }
        // Provider already has a name — only collect bio if empty
        if ((profile?.bio ?? '').trim()) {
          router.replace(nextPath)
          return
        }
        setNameAlreadyDone(true)
        setStep('bio')
      }

      if (row?.first_name) setFirstName(row.first_name)
      else if (row?.name) {
        const parts = row.name.trim().split(/\s+/)
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
      } else {
        const metaName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          ''
        if (metaName.trim()) {
          const parts = metaName.trim().split(/\s+/)
          setFirstName(parts[0] ?? '')
          setLastName(parts.slice(1).join(' '))
        }
      }
      if (row?.last_name) setLastName(row.last_name)
      if (profile?.bio) setBio(profile.bio)

      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router, nextPath])

  const totalSteps = asProvider && !nameAlreadyDone ? 2 : 1
  const phaseFills =
    totalSteps === 1
      ? step === 'bio'
        ? [1, 0, 0]
        : [1, 0, 0]
      : step === 'name'
        ? [0.5, 0, 0]
        : [1, 0.5, 0]

  async function saveName(): Promise<boolean> {
    const first = firstName.trim()
    if (!first) {
      setError('Ange ditt förnamn så vi vet vad vi ska kalla dig.')
      return false
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
      return false
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
      return false
    }

    track('profile_details_completed', {
      fields: ['name'],
      role: asProvider ? 'provider' : 'planner',
    })
    setLoading(false)
    return true
  }

  async function saveBio(): Promise<boolean> {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Du behöver vara inloggad.')
      setLoading(false)
      return false
    }

    const trimmed = bio.trim()
    // Ensure provider_profiles row exists (onboarding may create it next)
    const { data: existing } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error: bioError } = await supabase
        .from('provider_profiles')
        .update({ bio: trimmed || null })
        .eq('user_id', user.id)
      if (bioError) {
        setError('Kunde inte spara. Försök igen.')
        setLoading(false)
        return false
      }
    } else if (trimmed) {
      const { error: insertError } = await supabase.from('provider_profiles').insert({
        user_id: user.id,
        bio: trimmed,
      })
      if (insertError) {
        // Profile may be created in onboarding — non-fatal; name is what matters
        console.warn('[AccountOnboarding] bio insert deferred:', insertError.message)
      }
    }

    if (trimmed) {
      track('profile_details_completed', { fields: ['bio'], role: 'provider' })
    }
    setLoading(false)
    return true
  }

  async function handleNext() {
    if (step === 'name') {
      const ok = await saveName()
      if (!ok) return
      if (asProvider) {
        setStep('bio')
        return
      }
      router.replace(nextPath)
      return
    }

    const ok = await saveBio()
    if (!ok) return
    router.replace(nextPath)
  }

  function handleBack() {
    setError(null)
    if (step === 'bio' && !nameAlreadyDone) {
      setStep('name')
      return
    }
    router.push(nextPath)
  }

  function handleSkipBio() {
    router.replace(nextPath)
  }

  if (checking) {
    return (
      <ServiceWizardChrome
        hideFooter
        exitHref={nextPath}
        phaseFills={[0, 0, 0]}
        contentClassName="items-center justify-center"
      >
        <p className="text-[14px] text-[#6a6a6a]">Laddar…</p>
      </ServiceWizardChrome>
    )
  }

  return (
    <ServiceWizardChrome
      phaseFills={phaseFills}
      onBack={handleBack}
      onNext={() => void handleNext()}
      nextLabel={
        loading
          ? 'Sparar…'
          : step === 'bio'
            ? 'Fortsätt'
            : asProvider
              ? 'Nästa'
              : 'Fortsätt'
      }
      nextDisabled={loading || (step === 'name' && !firstName.trim())}
      nextLoading={loading}
      showBack={step === 'bio' && !nameAlreadyDone}
      exitHref={nextPath}
      contentClassName="max-w-xl mx-auto w-full justify-center"
    >
      {step === 'name' ? (
        <NameStep
          asProvider={asProvider}
          stepLabel={`Steg 1 av ${totalSteps}`}
          firstName={firstName}
          lastName={lastName}
          onFirstName={setFirstName}
          onLastName={setLastName}
          error={error}
          disabled={loading}
        />
      ) : (
        <BioStep
          firstName={firstName.trim() || 'dig'}
          stepLabel={
            nameAlreadyDone ? 'Nästan klart' : `Steg 2 av ${totalSteps}`
          }
          bio={bio}
          onBio={setBio}
          error={error}
          disabled={loading}
          onSkip={handleSkipBio}
        />
      )}
    </ServiceWizardChrome>
  )
}

function NameStep({
  asProvider,
  stepLabel,
  firstName,
  lastName,
  onFirstName,
  onLastName,
  error,
  disabled,
}: {
  asProvider: boolean
  stepLabel: string
  firstName: string
  lastName: string
  onFirstName: (v: string) => void
  onLastName: (v: string) => void
  error: string | null
  disabled: boolean
}) {
  return (
    <div className="w-full pt-4 sm:pt-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
        {stepLabel}
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight sm:text-[32px]">
        {asProvider ? 'Vad ska gäster kalla dig?' : 'Vad ska vi kalla dig?'}
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6a6a6a]">
        {asProvider
          ? 'Ditt namn syns på dina tjänster under “Träffa din leverantör” och i meddelanden.'
          : 'Så här syns du för talanger — till exempel när du skickar en bokningsförfrågan.'}
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="account-first-name" className="text-[14px] font-medium text-[#222222]">
            Förnamn
          </Label>
          <Input
            id="account-first-name"
            name="given-name"
            autoComplete="given-name"
            autoFocus
            value={firstName}
            onChange={e => onFirstName(e.target.value)}
            placeholder="Anna"
            className="h-14 rounded-xl border-[#b0b0b0] text-[16px] text-[#222222] shadow-none focus-visible:ring-[#222222]"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-last-name" className="text-[14px] font-medium text-[#222222]">
            Efternamn{' '}
            <span className="font-normal text-[#6a6a6a]">(valfritt)</span>
          </Label>
          <Input
            id="account-last-name"
            name="family-name"
            autoComplete="family-name"
            value={lastName}
            onChange={e => onLastName(e.target.value)}
            placeholder="Andersson"
            className="h-14 rounded-xl border-[#b0b0b0] text-[16px] text-[#222222] shadow-none focus-visible:ring-[#222222]"
            disabled={disabled}
          />
        </div>

        {error && (
          <p className="text-[14px] text-[#C13515]" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function BioStep({
  firstName,
  stepLabel,
  bio,
  onBio,
  error,
  disabled,
  onSkip,
}: {
  firstName: string
  stepLabel: string
  bio: string
  onBio: (v: string) => void
  error: string | null
  disabled: boolean
  onSkip: () => void
}) {
  return (
    <div className="w-full pt-4 sm:pt-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
        {stepLabel}
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight sm:text-[32px]">
        Berätta kort om dig
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6a6a6a]">
        Visas under “Träffa din leverantör” på dina tjänster. Du kan ändra det
        senare.
      </p>

      <div className="mt-8 space-y-3">
        <Label htmlFor="account-bio" className="text-[14px] font-medium text-[#222222]">
          Om {firstName}
        </Label>
        <Textarea
          id="account-bio"
          value={bio}
          onChange={e => onBio(e.target.value)}
          placeholder="T.ex. DJ med 10 års erfarenhet av bröllop och företagsfester i Stockholm…"
          rows={5}
          maxLength={600}
          className="min-h-[140px] rounded-xl border-[#b0b0b0] text-[16px] text-[#222222] shadow-none focus-visible:ring-[#222222]"
          disabled={disabled}
        />
        <p className="text-[13px] text-[#6a6a6a]">{bio.trim().length}/600</p>

        {error && (
          <p className="text-[14px] text-[#C13515]" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="pt-2 text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#6a6a6a] disabled:opacity-50"
        >
          Hoppa över just nu
        </button>
      </div>
    </div>
  )
}
