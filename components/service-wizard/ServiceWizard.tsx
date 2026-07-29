'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'
import { CATEGORIES, categoryTagsFromSlug, type CategorySlug } from '@/lib/categories'
import { LOCATIONS, getLocationLabel } from '@/lib/locations'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ServiceWizardChrome from '@/components/service-wizard/ServiceWizardChrome'
import PublishSuccessScreen from '@/components/service-wizard/PublishSuccessScreen'
import OccasionMultiSelect from '@/components/ui/OccasionMultiSelect'
import { formatOccasions } from '@/lib/occasions'
import { buildDisplayName } from '@/lib/profile-completeness'
import {
  type AccountWizardDraft,
  type FirstPublishStep,
  type ServiceWizardDraft,
  type ServiceWizardStep,
  draftFromService,
  EMPTY_ACCOUNT_DRAFT,
  firstPublishPhaseProgress,
  isAccountStepValid,
  isAccountWizardStep,
  isServiceWizardStep,
  isStepValid,
  nextFirstPublishStep,
  nextStep,
  phaseProgress,
  prevFirstPublishStep,
  prevStep,
  resumeFirstPublishStep,
  resumeStep,
} from '@/lib/service-wizard'

type ServiceSeed = {
  id: string
  title: string | null
  description: string | null
  category_slug?: string | null
  category_tags: string[] | null
  occasions?: string[] | null
  location_id?: string | null
  photos: string[] | null
  price_range_min: number | null
  price_range_max: number | null
  is_published: boolean
  created_at: string
}

type Props = {
  userId: string
  service: ServiceSeed
  resume?: boolean
  /** Where Tillbaka on first step / Spara & avsluta / Publicera go */
  hubPath?: string
  afterSavePath?: string
  afterPublishPath?: string
  /** Override first-step Tillbaka (onboarding exits instead of looping hub→flow) */
  firstBackPath?: string
  /**
   * First-time provider publish: prepend name + bio and use 4 progress phases.
   * Dashboard “new listing” leaves this false (3 phases).
   */
  includeAccountSteps?: boolean
  initialAccount?: Partial<AccountWizardDraft>
  /** Prefer DB truth over prefilled OAuth name for skipping steps */
  accountNeedsName?: boolean
  accountNeedsBio?: boolean
}

export default function ServiceWizard({
  userId,
  service,
  resume = false,
  hubPath = '/dashboard/listings/new',
  afterSavePath = '/dashboard/listings',
  afterPublishPath = '/dashboard/listings',
  firstBackPath,
  includeAccountSteps = false,
  initialAccount,
  accountNeedsName,
  accountNeedsBio,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialDraft = useMemo(() => draftFromService(service), [service])
  const [draft, setDraft] = useState<ServiceWizardDraft>(initialDraft)
  const [account, setAccount] = useState<AccountWizardDraft>(() => ({
    ...EMPTY_ACCOUNT_DRAFT,
    ...initialAccount,
  }))
  const needsName =
    accountNeedsName ?? !(initialAccount?.firstName ?? '').trim()
  const needsBio = accountNeedsBio ?? !(initialAccount?.bio ?? '').trim()
  const [step, setStep] = useState<FirstPublishStep>(() => {
    if (includeAccountSteps) {
      return resumeFirstPublishStep({
        needsName,
        needsBio,
        draft: initialDraft,
        resumeListing: resume,
      })
    }
    return resume ? resumeStep(initialDraft) : 'intro1'
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [published, setPublished] = useState(false)

  const fills = published
    ? includeAccountSteps
      ? [1, 1, 1, 1]
      : [1, 1, 1]
    : includeAccountSteps
      ? firstPublishPhaseProgress(step)
      : isServiceWizardStep(step)
        ? phaseProgress(step)
        : [0, 0, 0]

  const canNext = isAccountWizardStep(step)
    ? isAccountStepValid(step, account)
    : isServiceWizardStep(step)
      ? isStepValid(step, draft)
      : false

  const firstStep: FirstPublishStep = includeAccountSteps
    ? needsName
      ? 'name'
      : needsBio
        ? 'bio'
        : 'intro1'
    : 'intro1'

  const persist = useCallback(
    async (opts?: { publish?: boolean }) => {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          title: draft.title.trim() || null,
          description: draft.description.trim() || null,
          category_slug: draft.categorySlug,
          category_tags: categoryTagsFromSlug(draft.categorySlug),
          occasions: draft.occasions,
          city: getLocationLabel(draft.locationId),
          location_id: draft.locationId,
          price_range_min: draft.priceMin ? Number(draft.priceMin) : null,
          price_range_max: draft.priceMax ? Number(draft.priceMax) : null,
          photos: draft.photos,
          is_published: opts?.publish ? true : false,
          ...(opts?.publish ? { is_disabled: false } : {}),
        })
        .eq('id', service.id)

      if (updateError) throw updateError
    },
    [draft, service.id, supabase]
  )

  async function persistAccountName(): Promise<void> {
    const first = account.firstName.trim()
    const last = account.lastName.trim()
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: first,
        last_name: last || null,
        name: buildDisplayName(first, last),
        preferred_first_name: first,
      })
      .eq('id', userId)
    if (updateError) throw updateError
    track('profile_details_completed', { fields: ['name'], role: 'provider' })
  }

  async function persistAccountBio(): Promise<void> {
    const trimmed = account.bio.trim()
    const { data: existing } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      const { error: bioError } = await supabase
        .from('provider_profiles')
        .update({ bio: trimmed || null })
        .eq('user_id', userId)
      if (bioError) throw bioError
    } else if (trimmed) {
      const { error: insertError } = await supabase.from('provider_profiles').insert({
        user_id: userId,
        bio: trimmed,
      })
      if (insertError) throw insertError
    }
    if (trimmed) {
      track('profile_details_completed', { fields: ['bio'], role: 'provider' })
    }
  }

  async function handleSaveExit() {
    setSaving(true)
    setError(null)
    try {
      if (isServiceWizardStep(step)) {
        await persist({ publish: false })
      }
      router.push(afterSavePath)
      router.refresh()
    } catch {
      setError('Kunde inte spara. Försök igen.')
      setSaving(false)
    }
  }

  async function handlePreview() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await persist({ publish: false })
      const flowBase =
        hubPath === '/onboarding' ? '/onboarding/flow' : `${hubPath}/flow`
      const returnTo = `${flowBase}?resume=1&id=${service.id}`
      router.push(
        `/tjanster/${service.id}?return=${encodeURIComponent(returnTo)}`
      )
      router.refresh()
    } catch {
      setError('Kunde inte spara inför förhandsgranskning.')
      setSaving(false)
    }
  }

  async function handleNext() {
    if (!canNext || saving) return
    setError(null)

    if (step === 'name') {
      setSaving(true)
      try {
        await persistAccountName()
        const n = includeAccountSteps ? nextFirstPublishStep(step) : null
        if (n) setStep(n)
      } catch {
        setError('Kunde inte spara. Försök igen.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (step === 'bio') {
      setSaving(true)
      try {
        await persistAccountBio()
        const n = includeAccountSteps ? nextFirstPublishStep(step) : null
        if (n) setStep(n)
      } catch {
        setError('Kunde inte spara. Försök igen.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (step === 'publish') {
      setSaving(true)
      try {
        await persist({ publish: true })
        track('profile_published', { service_id: service.id })
        setPublished(true)
        setSaving(false)
      } catch {
        setError('Kunde inte publicera. Försök igen.')
        setSaving(false)
      }
      return
    }

    setSaving(true)
    try {
      await persist({ publish: false })
      const n = includeAccountSteps
        ? nextFirstPublishStep(step)
        : isServiceWizardStep(step)
          ? nextStep(step)
          : null
      if (n) setStep(n)
    } catch {
      setError('Kunde inte spara. Försök igen.')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    const p = includeAccountSteps
      ? prevFirstPublishStep(step)
      : isServiceWizardStep(step)
        ? prevStep(step)
        : null
    if (p) setStep(p)
    else router.push(firstBackPath ?? hubPath)
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 6 - draft.photos.length
    const toUpload = files.slice(0, remaining)
    setUploading(true)
    setError(null)
    try {
      const urls = await Promise.all(
        toUpload.map(async file => {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('provider-photos')
            .upload(path, file, { upsert: false })
          if (uploadError) throw uploadError
          return supabase.storage.from('provider-photos').getPublicUrl(path).data.publicUrl
        })
      )
      setDraft(prev => ({ ...prev, photos: [...prev.photos, ...urls].slice(0, 6) }))
    } catch {
      setError('Det gick inte att ladda upp bilden.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    setDraft(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))
  }

  function makeCover(index: number) {
    setDraft(prev => {
      if (index === 0) return prev
      const next = [...prev.photos]
      const [picked] = next.splice(index, 1)
      next.unshift(picked)
      return { ...prev, photos: next }
    })
  }

  const nextLabel =
    step === 'publish'
      ? 'Publicera tjänst'
      : step === 'bio'
        ? 'Nästa'
        : step.startsWith('intro')
          ? 'Nästa'
          : 'Nästa'

  const listingPhaseOffset = includeAccountSteps ? 1 : 0

  if (published) {
    return (
      <ServiceWizardChrome
        phaseFills={fills}
        hideFooter
        exitHref={afterPublishPath}
        contentClassName="items-center justify-center"
      >
        <PublishSuccessScreen
          serviceId={service.id}
          draft={draft}
          afterPublishPath={afterPublishPath}
        />
      </ServiceWizardChrome>
    )
  }

  return (
    <>
      <ServiceWizardChrome
        phaseFills={fills}
        onBack={handleBack}
        onNext={() => void handleNext()}
        nextLabel={nextLabel}
        nextDisabled={!canNext || uploading}
        nextLoading={saving}
        showBack={step !== firstStep}
        onSaveExit={handleSaveExit}
        savingExit={saving && step !== 'publish'}
        exitHref={afterSavePath}
        contentClassName="items-center justify-center"
      >
        <div className="w-full max-w-[640px]">
          {error && (
            <p className="mb-4 rounded-xl border border-[#f5c6c0] bg-[#fff5f3] px-4 py-3 text-[14px] text-[#C13515]">
              {error}
            </p>
          )}
          {step === 'name' && (
            <ProviderNameStep
              firstName={account.firstName}
              lastName={account.lastName}
              onFirstName={firstName => setAccount(a => ({ ...a, firstName }))}
              onLastName={lastName => setAccount(a => ({ ...a, lastName }))}
            />
          )}
          {step === 'bio' && (
            <ProviderBioStep
              firstName={account.firstName.trim() || 'dig'}
              bio={account.bio}
              onBio={bio => setAccount(a => ({ ...a, bio }))}
              onSkip={() => void handleNext()}
            />
          )}
          {step === 'intro1' && <Intro1 phaseNumber={1 + listingPhaseOffset} />}
          {step === 'title' && (
            <TitleStep
              value={draft.title}
              onChange={title => setDraft(prev => ({ ...prev, title: title.slice(0, 50) }))}
            />
          )}
          {step === 'category' && (
            <CategoryStep
              value={draft.categorySlug}
              onChange={categorySlug => setDraft(prev => ({ ...prev, categorySlug }))}
            />
          )}
          {step === 'occasions' && (
            <OccasionsStep
              value={draft.occasions}
              onChange={occasions => setDraft(prev => ({ ...prev, occasions }))}
            />
          )}
          {step === 'location' && (
            <LocationStep
              value={draft.locationId}
              onChange={locationId => setDraft(prev => ({ ...prev, locationId }))}
            />
          )}
          {step === 'intro2' && <Intro2 phaseNumber={2 + listingPhaseOffset} />}
          {step === 'description' && (
            <DescriptionStep
              value={draft.description}
              onChange={description =>
                setDraft(prev => ({ ...prev, description: description.slice(0, 500) }))
              }
            />
          )}
          {step === 'photos' && (
            <PhotosStep
              photos={draft.photos}
              uploading={uploading}
              onOpenModal={() => setPhotoModalOpen(true)}
              onRemove={removePhoto}
              onMakeCover={makeCover}
              onAddClick={() => fileInputRef.current?.click()}
            />
          )}
          {step === 'intro3' && <Intro3 phaseNumber={3 + listingPhaseOffset} />}
          {step === 'price' && (
            <PriceStep
              priceMin={draft.priceMin}
              priceMax={draft.priceMax}
              onChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
            />
          )}
          {step === 'publish' && (
            <PublishStep
              draft={draft}
              previewLoading={saving}
              onPreview={() => void handlePreview()}
            />
          )}
        </div>
      </ServiceWizardChrome>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {photoModalOpen && (
        <PhotoUploadModal
          photos={draft.photos}
          uploading={uploading}
          onClose={() => setPhotoModalOpen(false)}
          onBrowse={() => fileInputRef.current?.click()}
          onRemove={removePhoto}
          onDone={() => setPhotoModalOpen(false)}
        />
      )}
    </>
  )
}

function ProviderNameStep({
  firstName,
  lastName,
  onFirstName,
  onLastName,
}: {
  firstName: string
  lastName: string
  onFirstName: (v: string) => void
  onLastName: (v: string) => void
}) {
  return (
    <div>
      <p className="text-[16px] font-medium text-[#222222]">Steg 1</p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Vad ska gäster kalla dig?
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Ditt namn syns på dina tjänster under “Träffa din leverantör” och i meddelanden.
      </p>
      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="wizard-first-name" className="text-[14px] font-medium text-[#222222]">
            Förnamn
          </Label>
          <Input
            id="wizard-first-name"
            autoComplete="given-name"
            autoFocus
            value={firstName}
            onChange={e => onFirstName(e.target.value)}
            placeholder="Anna"
            className="h-14 rounded-xl border-[#b0b0b0] text-[16px] text-[#222222] shadow-none focus-visible:ring-[#222222]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wizard-last-name" className="text-[14px] font-medium text-[#222222]">
            Efternamn <span className="font-normal text-[#6a6a6a]">(valfritt)</span>
          </Label>
          <Input
            id="wizard-last-name"
            autoComplete="family-name"
            value={lastName}
            onChange={e => onLastName(e.target.value)}
            placeholder="Andersson"
            className="h-14 rounded-xl border-[#b0b0b0] text-[16px] text-[#222222] shadow-none focus-visible:ring-[#222222]"
          />
        </div>
      </div>
    </div>
  )
}

function ProviderBioStep({
  firstName,
  bio,
  onBio,
  onSkip,
}: {
  firstName: string
  bio: string
  onBio: (v: string) => void
  onSkip: () => void
}) {
  return (
    <div>
      <p className="text-[16px] font-medium text-[#222222]">Steg 1</p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Berätta kort om dig
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Visas under “Träffa din leverantör” på dina tjänster. Du kan ändra det senare.
      </p>
      <div className="mt-8 space-y-3">
        <Label htmlFor="wizard-bio" className="text-[14px] font-medium text-[#222222]">
          Om {firstName}
        </Label>
        <Textarea
          id="wizard-bio"
          value={bio}
          onChange={e => onBio(e.target.value.slice(0, 600))}
          placeholder="T.ex. DJ med 10 års erfarenhet av bröllop och företagsfester i Stockholm…"
          rows={5}
          maxLength={600}
          className="min-h-[140px] rounded-xl border-[#b0b0b0] text-[16px] text-[#222222] shadow-none focus-visible:ring-[#222222]"
        />
        <p className="text-[13px] text-[#6a6a6a]">{bio.trim().length}/600</p>
        <button
          type="button"
          onClick={onSkip}
          className="pt-2 text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#6a6a6a]"
        >
          Hoppa över just nu
        </button>
      </div>
    </div>
  )
}

function Intro1({ phaseNumber }: { phaseNumber: number }) {
  return (
    <div className="max-w-xl">
      <p className="text-[16px] font-medium text-[#222222]">Steg {phaseNumber}</p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.6px] text-[#222222] sm:text-[48px]">
        Berätta om din tjänst
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[#6a6a6a] sm:text-[18px]">
        I det här steget beskriver du vad du erbjuder — titel, kategori och var du arbetar.
        Planerare använder det för att hitta rätt talang till sitt kalas.
      </p>
    </div>
  )
}

function Intro2({ phaseNumber }: { phaseNumber: number }) {
  return (
    <div className="max-w-xl">
      <p className="text-[16px] font-medium text-[#222222]">Steg {phaseNumber}</p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.6px] text-[#222222] sm:text-[48px]">
        Gör din tjänst synlig
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[#6a6a6a] sm:text-[18px]">
        Lägg till en beskrivning och minst ett foto. Bra bilder och en tydlig text hjälper
        planerare att känna sig trygga när de skickar en förfrågan.
      </p>
    </div>
  )
}

function Intro3({ phaseNumber }: { phaseNumber: number }) {
  return (
    <div className="max-w-xl">
      <p className="text-[16px] font-medium text-[#222222]">Steg {phaseNumber}</p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.6px] text-[#222222] sm:text-[48px]">
        Avsluta och publicera
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[#6a6a6a] sm:text-[18px]">
        Sätt ditt prisintervall och publicera. Du kan alltid redigera tjänsten senare från
        din dashboard.
      </p>
    </div>
  )
}

function TitleStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Ge din tjänst en titel
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Korta titlar fungerar bäst. Ha kul — du kan alltid ändra senare.
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        autoFocus
        placeholder="t.ex. Wedding DJ med ceremonimusik"
        className="mt-8 w-full resize-y rounded-2xl border border-[#222222] px-4 py-4 text-[18px] text-[#222222] placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#222222]"
      />
      <p className="mt-2 text-[13px] text-[#6a6a6a]">{value.length}/50</p>
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
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Vad erbjuder du?
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Välj typ av tjänst — t.ex. DJ eller fotograf. Tillfällen (bröllop, barnkalas …) väljer du i
        nästa steg.
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

function OccasionsStep({
  value,
  onChange,
}: {
  value: import('@/lib/occasions').OccasionSlug[]
  onChange: (next: import('@/lib/occasions').OccasionSlug[]) => void
}) {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Vilka tillfällen passar dig?
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Välj ett eller flera. Planerare ser vilka fester du tar dig an.
      </p>
      <OccasionMultiSelect value={value} onChange={onChange} className="mt-8" />
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
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Var erbjuder du din tjänst?
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Vi lanserar i Stockholm. Fler städer kommer snart.
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

function DescriptionStep({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Skapa din beskrivning
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Berätta vad du erbjuder och vad som gör dig unik.
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={8}
        autoFocus
        placeholder="Beskriv vad du erbjuder, din stil och vad arrangörer kan förvänta sig..."
        className="mt-8 w-full resize-y rounded-2xl border border-[#222222] px-4 py-4 text-[16px] leading-relaxed text-[#222222] placeholder:text-[#929292] focus:outline-none focus:ring-2 focus:ring-[#222222]"
      />
      <p className="mt-2 text-[13px] text-[#6a6a6a]">{value.length}/500</p>
    </div>
  )
}

function PhotoRemoveButton({
  onClick,
  variant = 'light',
}: {
  onClick: () => void
  variant?: 'light' | 'dark'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === 'dark'
          ? 'absolute right-2 top-2 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-[#222222] text-white shadow'
          : 'absolute right-3 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#222222] shadow'
      }
      aria-label="Ta bort"
    >
      <TrashIcon />
    </button>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="block"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function PhotosStep({
  photos,
  uploading,
  onOpenModal,
  onRemove,
  onMakeCover,
  onAddClick,
}: {
  photos: string[]
  uploading: boolean
  onOpenModal: () => void
  onRemove: (i: number) => void
  onMakeCover: (i: number) => void
  onAddClick: () => void
}) {
  if (photos.length === 0) {
    return (
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
          Lägg till foton av din tjänst
        </h1>
        <p className="mt-2 text-[15px] text-[#6a6a6a]">
          Du behöver minst 1 foto för att fortsätta. Max 6 foton. Du kan ändra senare.
        </p>
        <button
          type="button"
          onClick={onOpenModal}
          className="mt-10 flex w-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#b0b0b0] bg-[#f7f7f7] px-6 py-20 transition hover:bg-[#f2f2f2]"
        >
          <span className="text-[48px]" aria-hidden>
            📷
          </span>
          <span className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#222222] shadow-sm">
            {uploading ? 'Laddar upp...' : 'Lägg till foton'}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Hur ser det ut?
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Första bilden är omslagsfoto. Tryck på en bild för att göra den till omslag.
      </p>

      <div className="mt-8 space-y-3">
        <div className="relative block w-full overflow-hidden rounded-2xl bg-[#ebebeb] aspect-[16/10]">
          <Image src={photos[0]} alt="" fill className="object-cover" sizes="640px" />
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#222222]">
            Omslagsfoto
          </span>
          <PhotoRemoveButton onClick={() => onRemove(0)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {photos.slice(1).map((url, i) => {
            const index = i + 1
            return (
              <div
                key={url}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#ebebeb]"
              >
                <Image src={url} alt="" fill className="object-cover" sizes="320px" />
                <button
                  type="button"
                  onClick={() => onMakeCover(index)}
                  className="absolute inset-0"
                  aria-label="Gör till omslagsfoto"
                />
                <PhotoRemoveButton onClick={() => onRemove(index)} />
              </div>
            )
          })}
          {photos.length < 6 && (
            <button
              type="button"
              onClick={onAddClick}
              disabled={uploading}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-2xl bg-[#f2f2f2] text-[14px] font-medium text-[#222222] hover:bg-[#ebebeb]"
            >
              <span className="text-[22px]">+</span>
              {uploading ? 'Laddar upp...' : 'Lägg till fler'}
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-[13px] text-[#6a6a6a]">{photos.length}/6 foton</p>
    </div>
  )
}

function PhotoUploadModal({
  photos,
  uploading,
  onClose,
  onBrowse,
  onRemove,
  onDone,
}: {
  photos: string[]
  uploading: boolean
  onClose: () => void
  onBrowse: () => void
  onRemove: (i: number) => void
  onDone: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#ebebeb] px-5 py-4">
          <button type="button" onClick={onClose} className="text-[20px] text-[#222222]" aria-label="Stäng">
            ×
          </button>
          <div className="text-center">
            <p className="text-[16px] font-semibold text-[#222222]">Ladda upp foton</p>
            <p className="text-[13px] text-[#6a6a6a]">
              {photos.length === 0
                ? 'Inga valda'
                : `${photos.length} av 6${uploading ? ' · laddar upp…' : ''}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onBrowse}
            disabled={photos.length >= 6 || uploading}
            className="text-[22px] font-light text-[#222222] disabled:opacity-40"
            aria-label="Lägg till"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b0b0b0] px-6 py-16 text-center">
              <p className="text-[22px] font-semibold text-[#222222]">Dra och släpp</p>
              <p className="mt-1 text-[14px] text-[#6a6a6a]">eller bläddra bland foton</p>
              <button
                type="button"
                onClick={onBrowse}
                className="mt-6 rounded-lg bg-[#222222] px-6 py-3 text-[14px] font-semibold text-white"
              >
                Bläddra
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((url, i) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-[#ebebeb]">
                  <Image src={url} alt="" fill className="object-cover" sizes="200px" />
                  <PhotoRemoveButton onClick={() => onRemove(i)} variant="dark" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#ebebeb] px-5 py-4">
          <button type="button" onClick={onClose} className="text-[14px] font-semibold text-[#222222]">
            Avbryt
          </button>
          <button
            type="button"
            onClick={onDone}
            disabled={photos.length < 1}
            className="rounded-lg bg-[#222222] px-6 py-3 text-[14px] font-semibold text-white disabled:bg-[#dddddd]"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  )
}

function PriceStep({
  priceMin,
  priceMax,
  onChange,
}: {
  priceMin: string
  priceMax: string
  onChange: (p: Partial<Pick<ServiceWizardDraft, 'priceMin' | 'priceMax'>>) => void
}) {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Sätt ditt pris
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Ange ett intervall — från lägsta till högsta pris för din tjänst.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#dddddd]">
        <label className="flex items-center justify-between gap-4 border-b border-[#ebebeb] px-5 py-5">
          <span className="text-[14px] text-[#6a6a6a]">Från</span>
          <span className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={priceMin}
              onChange={e => onChange({ priceMin: e.target.value })}
              placeholder="0"
              className="w-28 bg-transparent text-right text-[22px] font-semibold text-[#222222] outline-none"
            />
            <span className="text-[16px] text-[#6a6a6a]">kr</span>
          </span>
        </label>
        <label className="flex items-center justify-between gap-4 px-5 py-5">
          <span className="text-[14px] text-[#6a6a6a]">Upp till</span>
          <span className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={priceMax}
              onChange={e => onChange({ priceMax: e.target.value })}
              placeholder="0"
              className="w-28 bg-transparent text-right text-[22px] font-semibold text-[#222222] outline-none"
            />
            <span className="text-[16px] text-[#6a6a6a]">kr</span>
          </span>
        </label>
      </div>
    </div>
  )
}

function PublishStep({
  draft,
  onPreview,
  previewLoading,
}: {
  draft: ServiceWizardDraft
  onPreview: () => void
  previewLoading: boolean
}) {
  const cat = CATEGORIES.find(c => c.slug === draft.categorySlug)
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#222222] sm:text-[32px]">
        Redo att publicera?
      </h1>
      <p className="mt-2 text-[15px] text-[#6a6a6a]">
        Kontrollera att allt ser bra ut. När du publicerar syns tjänsten för planerare i
        Stockholm.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#dddddd]">
        {draft.photos[0] && (
          <div className="relative aspect-[16/10] bg-[#ebebeb]">
            <Image src={draft.photos[0]} alt="" fill className="object-cover" sizes="640px" />
          </div>
        )}
        <div className="space-y-2 p-5">
          <p className="text-[18px] font-semibold text-[#222222]">{draft.title}</p>
          <p className="text-[14px] text-[#6a6a6a]">
            {cat?.label ?? 'Tjänst'} · {getLocationLabel(draft.locationId)}
          </p>
          {formatOccasions(draft.occasions) ? (
            <p className="text-[14px] text-[#6a6a6a]">{formatOccasions(draft.occasions)}</p>
          ) : null}
          <p className="text-[14px] text-[#6a6a6a]">
            {draft.priceMin}–{draft.priceMax} kr · {draft.photos.length} foto
            {draft.photos.length === 1 ? '' : 'n'}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={previewLoading}
        onClick={onPreview}
        className="mt-5 h-11 w-full rounded-xl border-[#dddddd] text-[15px] font-semibold sm:w-auto sm:px-6"
      >
        {previewLoading ? 'Sparar…' : 'Förhandsgranska'}
      </Button>
    </div>
  )
}
