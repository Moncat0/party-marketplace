'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'

type ExistingProfile = {
  id: string
  service_title: string | null
  category_tags: string[]
  city: string | null
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

const STEP_LABELS = [
  'Tjänst', 'Taggar', 'Stad', 'Om dig', 'Pris', 'Foton',
]

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
    category_tags: existingProfile?.category_tags ?? [] as string[],
    city: existingProfile?.city ?? 'Stockholm',
    service_description: existingProfile?.service_description ?? '',
    price_range_min: existingProfile?.price_range_min?.toString() ?? '',
    price_range_max: existingProfile?.price_range_max?.toString() ?? '',
    photos: existingProfile?.photos ?? [] as string[],
  })

  useEffect(() => {
    if (!existingProfile) {
      track('onboarding_started', { user_id: userId })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const canProceed = (() => {
    switch (step) {
      case 1: return formData.service_title.trim().length > 0
      case 2: return true
      case 3: return formData.city.trim().length > 0
      case 4: return formData.service_description.trim().length > 0
      case 5: return true
      case 6: return formData.photos.length > 0
      default: return false
    }
  })()

  async function upsertProfile(extraFields?: Record<string, unknown>) {
    const data = {
      user_id: userId,
      service_title: formData.service_title || null,
      category_tags: formData.category_tags,
      city: formData.city || null,
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
      category_tags: prev.category_tags.filter(t => t !== tag),
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
        toUpload.map(async (file) => {
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
      await supabase.from('users').update({ user_type: 'provider' }).eq('id', userId)
      track('onboarding_completed', {
        user_id: userId,
        category_tags: formData.category_tags,
        city: formData.city,
      })
      // Fire portrait generation in the background — don't await so user isn't blocked
      if (profileId) {
        fetch('/api/portraits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: profileId,
            service_title: formData.service_title,
            category_tags: formData.category_tags,
          }),
        }).catch(() => {/* silent fail */})
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
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Vad erbjuder du?</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">Skriv en kort titel för din tjänst.</p>
            <input
              type="text"
              value={formData.service_title}
              onChange={e => setFormData(prev => ({ ...prev, service_title: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && canProceed) handleNext() }}
              placeholder="t.ex. Jazz-sångare, DJ, Makeupartist"
              autoFocus
              className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
          </div>
        )

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Vilka taggar passar dig?</h2>
            <p className="text-sm text-[#5F5E5A] mb-4">Lägg till taggar som hjälper arrangörer hitta dig. (Valfritt)</p>

            {formData.category_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.category_tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-[#FF6B35] px-3 py-1 text-sm text-white"
                  >
                    {tag}
                    <button
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

            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
              placeholder="Skriv en tagg och tryck Enter..."
              className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORY_SUGGESTIONS.filter(s => !formData.category_tags.includes(s)).map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => addTag(suggestion)}
                  className="rounded-full border border-[#E8E3DC] bg-white px-3 py-1 text-sm text-[#5F5E5A] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Var är du baserad?</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">Vi lanserar i Stockholm. Fler städer kommer snart.</p>
            <input
              type="text"
              value={formData.city}
              onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && canProceed) handleNext() }}
              placeholder="Stockholm"
              autoFocus
              className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
          </div>
        )

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Berätta om dig själv</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">Vad erbjuder du? Vad gör dig unik?</p>
            <textarea
              value={formData.service_description}
              onChange={e =>
                setFormData(prev => ({ ...prev, service_description: e.target.value.slice(0, 500) }))
              }
              placeholder="Beskriv din tjänst, din stil och vad arrangörer kan förvänta sig..."
              rows={5}
              autoFocus
              className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
            />
            <p className="mt-1 text-right text-xs text-[#5F5E5A]">
              {formData.service_description.length}/500
            </p>
          </div>
        )

      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Vad kostar du?</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">
              Ange ett ungefärligt prisintervall i SEK. Valfritt — lämna blankt för att hoppa över.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#5F5E5A] mb-1">Från</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price_range_min}
                  onChange={e => setFormData(prev => ({ ...prev, price_range_min: e.target.value }))}
                  placeholder="2 000"
                  className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>
              <span className="pb-3 text-[#5F5E5A]">–</span>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#5F5E5A] mb-1">Till</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price_range_max}
                  onChange={e => setFormData(prev => ({ ...prev, price_range_max: e.target.value }))}
                  placeholder="5 000"
                  className="w-full rounded-xl border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-[#5F5E5A]">SEK · Du kan ändra detta när som helst.</p>
          </div>
        )

      case 6:
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Lägg till foton</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">
              Ladda upp minst ett foto för att publicera din profil. Max 5 foton.
            </p>

            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {formData.photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F0EDE8]">
                    <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                    <button
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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-[#E8E3DC] px-4 py-8 text-sm text-[#5F5E5A] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Laddar upp...' : '+ Välj foton'}
                </button>
              </>
            )}

            {formData.photos.length > 0 && (
              <p className="mt-2 text-center text-xs text-[#5F5E5A]">
                {formData.photos.length}/5 foton · Du kan ändra detta senare.
              </p>
            )}
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">FESTEN.</h1>
          <p className="mt-1 text-sm text-[#5F5E5A]">{isEditing ? 'Redigera din profil' : 'Skapa din profil'}</p>
        </div>

        {/* Step progress bar */}
        <div className="mb-2 flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-[#FF6B35]' : 'bg-[#E8E3DC]'
              }`}
            />
          ))}
        </div>
        <p className="mb-8 text-xs text-[#5F5E5A]">
          Steg {step} av 6 — {STEP_LABELS[step - 1]}
        </p>

        {/* Step content */}
        {renderStep()}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={saving}
              className="flex-1 rounded-xl border border-[#E8E3DC] px-4 py-3 text-sm font-medium text-[#5F5E5A] hover:bg-[#F0EDE8] transition-colors disabled:opacity-50"
            >
              ← Tillbaka
            </button>
          )}

          {step < 6 && (
            <button
              onClick={handleNext}
              disabled={!canProceed || saving}
              className="flex-1 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40"
            >
              {saving ? 'Sparar...' : 'Nästa →'}
            </button>
          )}

          {step === 6 && (
            <button
              onClick={handlePublish}
              disabled={!canProceed || saving || uploading}
              className="flex-1 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40"
            >
              {saving ? 'Sparar...' : isEditing ? 'Spara ändringar' : 'Publicera profil 🎉'}
            </button>
          )}
        </div>

      </div>
    </main>
  )
}
