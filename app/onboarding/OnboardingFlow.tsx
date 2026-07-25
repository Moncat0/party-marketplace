'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import LocationSelect from '@/components/ui/LocationSelect'
import { settingsTokens as t } from '@/components/settings/tokens'
import {
  DEFAULT_LOCATION_ID,
  getLocationLabel,
  locationIdFromCity,
} from '@/lib/locations'

type ExistingProfile = {
  id: string
  service_title: string | null
  category_tags: string[]
  city: string | null
  location_id?: string | null
  service_description: string | null
  price_range_min: number | null
  price_range_max: number | null
  photos: string[]
}

type Props = {
  userId: string
  existingProfile: ExistingProfile | null
  isEditing?: boolean
}

const CATEGORY_SUGGESTIONS = [
  'Sångare', 'DJ', 'Fotograf', 'Makeupartist', 'Kock',
  'Underhållare', 'Dansare', 'Musiker', 'Trollkarl', 'Ballongkonstnär',
  'Skådespelare', 'Komiker',
]

const STEP_LABELS = ['Tjänst', 'Taggar', 'Plats', 'Om dig', 'Pris', 'Foton']

const textareaStyle = {
  minHeight: 120,
  padding: '14px 12px',
  borderRadius: t.rounded.sm,
  border: `1px solid ${t.colors.hairline}`,
} as const

export default function OnboardingFlow({ userId, existingProfile, isEditing = false }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [profileId, setProfileId] = useState<string | null>(existingProfile?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  const [formData, setFormData] = useState({
    service_title: existingProfile?.service_title ?? '',
    category_tags: existingProfile?.category_tags ?? ([] as string[]),
    location_id:
      existingProfile?.location_id ??
      locationIdFromCity(existingProfile?.city) ??
      DEFAULT_LOCATION_ID,
    service_description: existingProfile?.service_description ?? '',
    price_range_min: existingProfile?.price_range_min?.toString() ?? '',
    price_range_max: existingProfile?.price_range_max?.toString() ?? '',
    photos: existingProfile?.photos ?? ([] as string[]),
  })

  useEffect(() => {
    if (!existingProfile) {
      track('onboarding_started', { user_id: userId })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const canProceed = (() => {
    switch (step) {
      case 1:
        return formData.service_title.trim().length > 0
      case 2:
        return true
      case 3:
        return !!formData.location_id
      case 4:
        return formData.service_description.trim().length > 0
      case 5:
        return true
      case 6:
        return formData.photos.length > 0
      default:
        return false
    }
  })()

  async function upsertProfile(extraFields?: Record<string, unknown>) {
    const data = {
      user_id: userId,
      service_title: formData.service_title || null,
      category_tags: formData.category_tags,
      city: getLocationLabel(formData.location_id),
      location_id: formData.location_id,
      service_description: formData.service_description || null,
      price_range_min: formData.price_range_min ? Number(formData.price_range_min) : null,
      price_range_max: formData.price_range_max ? Number(formData.price_range_max) : null,
      photos: formData.photos,
      ...extraFields,
    }

    if (profileId) {
      const { error } = await supabase.from('provider_profiles').update(data).eq('id', profileId)
      if (error) throw error
    } else {
      const { data: profile, error } = await supabase
        .from('provider_profiles')
        .insert(data)
        .select('id')
        .single()
      if (error) throw error
      setProfileId(profile.id)
    }
  }

  async function handleNext() {
    setSaving(true)
    setError(null)
    try {
      await upsertProfile()
      setStep(s => s + 1)
    } catch {
      setError('Något gick fel. Försök igen.')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    setError(null)
    setStep(s => s - 1)
  }

  function addTag(tag: string) {
    const cleaned = tag.trim().replace(/,$/, '')
    if (!cleaned || formData.category_tags.includes(cleaned)) {
      setTagInput('')
      return
    }
    setFormData(prev => ({ ...prev, category_tags: [...prev.category_tags, cleaned] }))
    setTagInput('')
  }

  function removeTag(tag: string) {
    setFormData(prev => ({
      ...prev,
      category_tags: prev.category_tags.filter(tg => tg !== tag),
    }))
  }

  function removePhoto(index: number) {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const remaining = 5 - formData.photos.length
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
          const { data } = supabase.storage.from('provider-photos').getPublicUrl(path)
          return data.publicUrl
        })
      )
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...urls] }))
    } catch {
      setError('Det gick inte att ladda upp bilden. Försök igen.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handlePublish() {
    setSaving(true)
    setError(null)
    try {
      await upsertProfile({ is_published: true })
      const { data: current } = await supabase.from('users').select('user_type').eq('id', userId).maybeSingle()
      const nextType =
        current?.user_type === 'planner' || current?.user_type === 'both' ? 'both' : 'provider'
      await supabase.from('users').update({ user_type: nextType }).eq('id', userId)
      track('onboarding_completed', {
        user_id: userId,
        category_tags: formData.category_tags,
        location_id: formData.location_id,
        city: getLocationLabel(formData.location_id),
      })
      if (profileId) {
        fetch('/api/portraits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: profileId,
            service_title: formData.service_title,
            category_tags: formData.category_tags,
          }),
        }).catch(() => {
          /* silent fail */
        })
      }
      router.push('/dashboard')
    } catch {
      setError('Något gick fel. Försök igen.')
      setSaving(false)
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <SettingsSection title="Vad erbjuder du?" description="Skriv en kort titel för din tjänst.">
            <SettingsInput
              id="service_title"
              label="Titel"
              value={formData.service_title}
              onChange={v => setFormData(prev => ({ ...prev, service_title: v }))}
              onKeyDown={e => {
                if (e.key === 'Enter' && canProceed) handleNext()
              }}
              placeholder="t.ex. Jazz-sångare, DJ, Makeupartist"
              autoFocus
            />
          </SettingsSection>
        )

      case 2:
        return (
          <SettingsSection
            title="Vilka taggar passar dig?"
            description="Lägg till taggar som hjälper arrangörer hitta dig. (Valfritt)"
          >
            {formData.category_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.category_tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 text-[13px] text-white"
                    style={{
                      backgroundColor: t.colors.primary,
                      borderRadius: t.rounded.full,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 text-white/70 hover:text-white leading-none"
                      aria-label={`Ta bort ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <SettingsInput
              id="tag_input"
              label="Lägg till tagg"
              value={tagInput}
              onChange={setTagInput}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
              placeholder="Skriv en tagg och tryck Enter..."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORY_SUGGESTIONS.filter(s => !formData.category_tags.includes(s)).map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="px-3 py-1 text-[13px] text-[#6a6a6a] transition-colors hover:text-[#FF6B35]"
                  style={{
                    borderRadius: t.rounded.full,
                    border: `1px solid ${t.colors.hairline}`,
                  }}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </SettingsSection>
        )

      case 3:
        return (
          <SettingsSection
            title="Var erbjuder du din tjänst?"
            description="Vi lanserar i Stockholm. Fler städer kommer snart."
          >
            <LocationSelect
              value={formData.location_id}
              onChange={location_id => setFormData(prev => ({ ...prev, location_id }))}
              showComingSoon
            />
          </SettingsSection>
        )

      case 4:
        return (
          <SettingsSection title="Berätta om dig själv" description="Vad erbjuder du? Vad gör dig unik?">
            <textarea
              value={formData.service_description}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  service_description: e.target.value.slice(0, 500),
                }))
              }
              placeholder="Beskriv din tjänst, din stil och vad arrangörer kan förvänta sig..."
              rows={5}
              autoFocus
              className="w-full bg-white text-[#222222] text-[16px] leading-[1.5] placeholder:text-[#929292] focus:outline-none resize-none"
              style={textareaStyle}
              onFocus={e => {
                e.currentTarget.style.border = `2px solid ${t.colors.ink}`
                e.currentTarget.style.padding = '13px 11px'
              }}
              onBlur={e => {
                e.currentTarget.style.border = `1px solid ${t.colors.hairline}`
                e.currentTarget.style.padding = '14px 12px'
              }}
            />
            <p className="mt-1.5 text-right text-[13px] text-[#929292]">
              {formData.service_description.length}/500
            </p>
          </SettingsSection>
        )

      case 5:
        return (
          <SettingsSection
            title="Vad kostar du?"
            description="Ange ett ungefärligt prisintervall i SEK. Valfritt — lämna blankt för att hoppa över."
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <SettingsInput
                  id="price_min"
                  label="Från"
                  type="number"
                  min={0}
                  value={formData.price_range_min}
                  onChange={v => setFormData(prev => ({ ...prev, price_range_min: v }))}
                  placeholder="2 000"
                />
              </div>
              <span className="pb-4 text-[#6a6a6a]">–</span>
              <div className="flex-1">
                <SettingsInput
                  id="price_max"
                  label="Till"
                  type="number"
                  min={0}
                  value={formData.price_range_max}
                  onChange={v => setFormData(prev => ({ ...prev, price_range_max: v }))}
                  placeholder="5 000"
                />
              </div>
            </div>
            <p className="mt-2 text-[13px] text-[#929292]">SEK · Du kan ändra detta när som helst.</p>
          </SettingsSection>
        )

      case 6:
        return (
          <SettingsSection
            title="Lägg till foton"
            description="Ladda upp minst ett foto för att publicera din profil. Max 5 foton."
          >
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {formData.photos.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden bg-[#f2f2f2]"
                    style={{ borderRadius: t.rounded.sm }}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70"
                      aria-label="Ta bort foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.photos.length < 5 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-8 text-[14px] text-[#6a6a6a] transition-colors hover:text-[#FF6B35] disabled:opacity-50"
                  style={{
                    borderRadius: t.rounded.sm,
                    border: `2px dashed ${t.colors.hairline}`,
                  }}
                >
                  {uploading ? 'Laddar upp...' : '+ Välj foton'}
                </button>
              </>
            )}

            {formData.photos.length > 0 && (
              <p className="mt-3 text-center text-[13px] text-[#929292]">
                {formData.photos.length}/5 foton · Du kan ändra detta senare.
              </p>
            )}
          </SettingsSection>
        )
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[#FF6B35]">FESTEN.</h1>
          <p className="mt-1 text-[14px] text-[#6a6a6a]">
            {isEditing ? 'Redigera din profil' : 'Skapa din profil'}
          </p>
        </div>

        <div className="mb-2 flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 transition-colors"
              style={{
                borderRadius: t.rounded.full,
                backgroundColor: i + 1 <= step ? t.colors.primary : t.colors.hairline,
              }}
            />
          ))}
        </div>
        <p className="mb-6 text-[13px] text-[#6a6a6a]">
          Steg {step} av 6 — {STEP_LABELS[step - 1]}
        </p>

        {renderStep()}

        {error && (
          <div
            className="mt-4 px-4 py-3 text-[14px]"
            style={{
              color: t.colors.error,
              backgroundColor: '#fff5f3',
              borderRadius: t.rounded.sm,
              border: '1px solid #f5c6c0',
            }}
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <SettingsButton
              variant="secondary"
              className="flex-1"
              onClick={handleBack}
              disabled={saving}
            >
              ← Tillbaka
            </SettingsButton>
          )}

          {step < 6 && (
            <SettingsButton
              className="flex-1"
              onClick={handleNext}
              disabled={!canProceed || saving}
            >
              {saving ? 'Sparar...' : 'Nästa →'}
            </SettingsButton>
          )}

          {step === 6 && (
            <SettingsButton
              className="flex-1"
              onClick={handlePublish}
              disabled={!canProceed || saving || uploading}
            >
              {saving ? 'Sparar...' : isEditing ? 'Spara ändringar' : 'Publicera profil'}
            </SettingsButton>
          )}
        </div>
      </div>
    </main>
  )
}
