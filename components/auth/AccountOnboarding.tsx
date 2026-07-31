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
import {
  buildSokUrl,
  EMPTY_PLANNER_SEARCH_DRAFT,
  isPlannerDiscoveryNext,
  isPlannerSearchStepValid,
  nextPlannerSearchStep,
  plannerSearchPhaseFills,
  prevPlannerSearchStep,
  type PlannerSearchDraft,
  type PlannerSearchStep,
} from '@/lib/planner-search-wizard'
import { CATEGORIES, type CategorySlug } from '@/lib/categories'
import { LOCATIONS } from '@/lib/locations'
import { OCCASIONS, type OccasionSlug } from '@/lib/occasions'
import ServiceWizardChrome from '@/components/service-wizard/ServiceWizardChrome'
import FormErrorAlert from '@/components/auth/FormErrorAlert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
  /** Where to go after the wizard finishes (soft gate) or fallback */
  nextPath: string
  /**
   * Local `/dev` previews — skip auth, skip DB writes, stay on-page.
   * Never enable in production routes.
   */
  previewMode?: boolean
  /** Optional starting step when previewMode is on */
  previewStep?: PlannerSearchStep
}

/**
 * Planner welcome: name → location → category → occasion → /sok.
 * Soft-gate deep links: name only → nextPath.
 * Providers are redirected to the unified listing onboarding flow.
 */
export default function AccountOnboarding({
  nextPath,
  previewMode = false,
  previewStep,
}: Props) {
  const router = useRouter()
  const discovery = isPlannerDiscoveryNext(nextPath)
  const [checking, setChecking] = useState(!previewMode)
  const [step, setStep] = useState<PlannerSearchStep>(
    previewMode && previewStep ? previewStep : 'name'
  )
  const [draft, setDraft] = useState<PlannerSearchDraft>(EMPTY_PLANNER_SEARCH_DRAFT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    if (previewMode) {
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
        router.replace(`/?auth=1&next=${encodeURIComponent('/welcome')}`)
        return
      }

      const { data: row } = await supabase
        .from('users')
        .select('name, first_name, last_name, user_type')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      const providerSide =
        row?.user_type === 'provider' ||
        row?.user_type === 'both' ||
        isProviderDestination(nextPath)

      if (providerSide) {
        router.replace('/onboarding/flow')
        return
      }

      // Soft gate: name already done → continue to destination
      if (!needsDisplayName(row) && !discovery) {
        router.replace(nextPath)
        return
      }

      // Discovery: name already done → start at location
      if (!needsDisplayName(row) && discovery) {
        setNameSaved(true)
        setStep('location')
      }

      const nextDraft = { ...EMPTY_PLANNER_SEARCH_DRAFT }
      if (row?.first_name) nextDraft.firstName = row.first_name
      else if (row?.name) {
        const parts = row.name.trim().split(/\s+/)
        nextDraft.firstName = parts[0] ?? ''
        nextDraft.lastName = parts.slice(1).join(' ')
      } else {
        const metaName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          ''
        if (metaName.trim()) {
          const parts = metaName.trim().split(/\s+/)
          nextDraft.firstName = parts[0] ?? ''
          nextDraft.lastName = parts.slice(1).join(' ')
        }
      }
      if (row?.last_name) nextDraft.lastName = row.last_name
      setDraft(nextDraft)
      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router, nextPath, discovery, previewMode])

  const phaseFills = discovery ? plannerSearchPhaseFills(step) : [1]

  async function saveName(): Promise<boolean> {
    const first = draft.firstName.trim()
    if (!first) {
      setError('Ange ditt förnamn så vi vet vad vi ska kalla dig.')
      return false
    }

    if (previewMode) {
      setNameSaved(true)
      return true
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

    const last = draft.lastName.trim()
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: first,
        last_name: last || null,
        name: buildDisplayName(first, last),
        preferred_first_name: first,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Kunde inte spara. Försök igen.')
      setLoading(false)
      return false
    }

    track('profile_details_completed', { fields: ['name'], role: 'planner' })
    setNameSaved(true)
    setLoading(false)
    return true
  }

  async function handleNext() {
    if (!isPlannerSearchStepValid(step, draft) || loading) return

    if (step === 'name' && !nameSaved) {
      const ok = await saveName()
      if (!ok) return
      if (!discovery) {
        if (previewMode) return
        router.replace(nextPath)
        return
      }
      setStep('location')
      return
    }

    if (step === 'name' && !discovery) {
      if (previewMode) return
      router.replace(nextPath)
      return
    }

    const n = nextPlannerSearchStep(step)
    if (n) {
      setStep(n)
      return
    }

    // Finished discovery
    if (previewMode) {
      setError(null)
      return
    }
    track('planner_search_onboarding_completed', {
      location: draft.locationId,
      category: draft.categorySlug,
      occasion: draft.occasion,
    })
    router.replace(buildSokUrl(draft))
  }

  function handleBack() {
    setError(null)
    const p = prevPlannerSearchStep(step)
    if (p) {
      setStep(p)
      return
    }
    if (previewMode) return
    router.push(nextPath === '/' ? '/' : nextPath)
  }

  if (checking) {
    return (
      <ServiceWizardChrome
        hideFooter
        exitHref={discovery ? '/' : nextPath}
        phaseFills={discovery ? [0, 0, 0, 0] : [0]}
        contentClassName="items-center justify-center"
      >
        <p className="text-[14px] text-[#6a6a6a]">Laddar…</p>
      </ServiceWizardChrome>
    )
  }

  const canNext = isPlannerSearchStepValid(step, draft)
  const nextLabel =
    loading
      ? 'Sparar…'
      : step === 'occasion'
        ? 'Visa resultat'
        : !discovery && step === 'name'
          ? 'Fortsätt'
          : 'Nästa'

  return (
    <ServiceWizardChrome
      phaseFills={phaseFills}
      onBack={handleBack}
      onNext={() => void handleNext()}
      nextLabel={nextLabel}
      nextDisabled={!canNext || loading}
      nextLoading={loading}
      showBack={step !== 'name'}
      exitHref={discovery ? '/' : nextPath}
      contentClassName="max-w-xl mx-auto w-full justify-start"
    >
      {step === 'name' && (
        <NameStep
          firstName={draft.firstName}
          lastName={draft.lastName}
          onFirstName={v => setDraft(d => ({ ...d, firstName: v }))}
          onLastName={v => setDraft(d => ({ ...d, lastName: v }))}
          error={error}
          disabled={loading}
          discovery={discovery}
        />
      )}
      {step === 'location' && (
        <LocationStep
          value={draft.locationId}
          onChange={locationId => setDraft(d => ({ ...d, locationId }))}
        />
      )}
      {step === 'category' && (
        <CategoryStep
          value={draft.categorySlug}
          onChange={categorySlug => setDraft(d => ({ ...d, categorySlug }))}
        />
      )}
      {step === 'occasion' && (
        <OccasionStep
          value={draft.occasion}
          onChange={occasion => setDraft(d => ({ ...d, occasion }))}
        />
      )}
    </ServiceWizardChrome>
  )
}

function NameStep({
  firstName,
  lastName,
  onFirstName,
  onLastName,
  error,
  disabled,
  discovery,
}: {
  firstName: string
  lastName: string
  onFirstName: (v: string) => void
  onLastName: (v: string) => void
  error: string | null
  disabled: boolean
  discovery: boolean
}) {
  return (
    <div className="w-full">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
        {discovery ? 'Steg 1 av 4' : 'Nästan klart'}
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight sm:text-[32px]">
        Vad ska vi kalla dig?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6a6a6a]">
        {discovery
          ? 'Sedan hjälper vi dig hitta rätt talang till ditt kalas.'
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
            Efternamn <span className="font-normal text-[#6a6a6a]">(valfritt)</span>
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
        {error && <FormErrorAlert className="text-[14px]">{error}</FormErrorAlert>}
      </div>
    </div>
  )
}

function LocationStep({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="w-full">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
        Steg 2 av 4
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight sm:text-[32px]">
        Var hålls festen?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6a6a6a]">
        Vi finns i Stockholm just nu. Fler städer kommer snart.
      </p>
      <div className="mt-8 space-y-3">
        {LOCATIONS.map(loc => {
          const selected = value === loc.id
          const disabled = !loc.active
          return (
            <button
              key={loc.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(loc.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition',
                disabled && 'cursor-not-allowed opacity-50',
                selected && !disabled
                  ? 'border-2 border-[#222222] bg-[#f7f7f7]'
                  : 'border border-[#dddddd]',
                !disabled && !selected && 'hover:border-[#222222]'
              )}
            >
              <span className="text-[16px] font-medium text-[#222222]">{loc.label}</span>
              {!loc.active && (
                <span className="text-[13px] text-[#6a6a6a]">Kommer snart</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CategoryStep({
  value,
  onChange,
}: {
  value: CategorySlug | null
  onChange: (slug: CategorySlug) => void
}) {
  return (
    <div className="w-full">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
        Steg 3 av 4
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight sm:text-[32px]">
        Vilken typ av talang söker du?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6a6a6a]">
        Välj det som passar ditt kalas bäst — du kan ändra filtret senare.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map(cat => {
          const selected = value === cat.slug
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onChange(cat.slug as CategorySlug)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-2xl border px-4 py-5 text-left transition',
                selected
                  ? 'border-2 border-[#222222] bg-[#f7f7f7]'
                  : 'border border-[#dddddd] hover:border-[#222222]'
              )}
            >
              <span className="text-[28px]" aria-hidden>
                {cat.emoji}
              </span>
              <span className="text-[14px] font-semibold text-[#222222]">
                {cat.chipLabel ?? cat.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OccasionStep({
  value,
  onChange,
}: {
  value: OccasionSlug | null
  onChange: (slug: OccasionSlug) => void
}) {
  return (
    <div className="w-full">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]">
        Steg 4 av 4
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#222222] leading-tight sm:text-[32px]">
        Vilket tillfälle är det?
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6a6a6a]">
        Vi visar talanger som passar just den typen av fest.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {OCCASIONS.map(o => {
          const selected = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                'rounded-2xl border px-4 py-4 text-left text-[14px] font-semibold transition',
                selected
                  ? 'border-2 border-[#222222] bg-[#f7f7f7] text-[#222222]'
                  : 'border border-[#dddddd] text-[#222222] hover:border-[#222222]'
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
