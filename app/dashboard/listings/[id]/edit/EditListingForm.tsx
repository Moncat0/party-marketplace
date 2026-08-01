'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import LocationSelect from '@/components/ui/LocationSelect'
import OccasionMultiSelect from '@/components/ui/OccasionMultiSelect'
import { Button } from '@/components/ui/button'
import { settingsTokens as t } from '@/components/settings/tokens'
import {
  CATEGORIES,
  categoryTagsFromSlug,
  resolveCategorySlug,
  type CategorySlug,
} from '@/lib/categories'
import { normalizeOccasions, type OccasionSlug } from '@/lib/occasions'
import { cn } from '@/lib/utils'
import {
  DEFAULT_LOCATION_ID,
  getLocationLabel,
  locationIdFromCity,
} from '@/lib/locations'
import {
  CANCELLATION_POLICIES,
  isCancellationPolicyId,
  type CancellationPolicyId,
} from '@/lib/cancellation-policies'

type Service = {
  id: string
  title: string | null
  description: string | null
  category_slug?: string | null
  category_tags: string[] | null
  occasions?: string[] | null
  city: string | null
  location_id?: string | null
  price_range_min: number | null
  price_range_max: number | null
  cancellation_policy?: string | null
  photos: string[] | null
}

export default function EditListingForm({ service, userId }: { service: Service; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    service_title: service.title ?? '',
    service_description: service.description ?? '',
    category_slug: resolveCategorySlug({
      category_slug: service.category_slug,
      category_tags: service.category_tags,
    }) as CategorySlug | null,
    occasions: normalizeOccasions(service.occasions) as OccasionSlug[],
    location_id: service.location_id ?? locationIdFromCity(service.city) ?? DEFAULT_LOCATION_ID,
    price_range_min: service.price_range_min?.toString() ?? '',
    price_range_max: service.price_range_max?.toString() ?? '',
    cancellation_policy: (isCancellationPolicyId(service.cancellation_policy)
      ? service.cancellation_policy
      : null) as CancellationPolicyId | null,
    photos: service.photos ?? [],
  })

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function removePhoto(index: number) {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 5 - form.photos.length
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
      setForm(prev => ({ ...prev, photos: [...prev.photos, ...urls] }))
    } catch {
      setError('Det gick inte att ladda upp bilden.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!form.category_slug) {
      setError('Välj en kategori för din tjänst.')
      return
    }
    if (form.occasions.length < 1) {
      setError('Välj minst ett tillfälle.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('services')
      .update({
        title: form.service_title || null,
        description: form.service_description || null,
        category_slug: form.category_slug,
        category_tags: categoryTagsFromSlug(form.category_slug),
        occasions: form.occasions,
        city: getLocationLabel(form.location_id),
        location_id: form.location_id,
        price_range_min: form.price_range_min ? Number(form.price_range_min) : null,
        price_range_max: form.price_range_max ? Number(form.price_range_max) : null,
        cancellation_policy: form.cancellation_policy,
        photos: form.photos,
      })
      .eq('id', service.id)

    if (updateError) {
      setError('Något gick fel. Försök igen.')
      setSaving(false)
      return
    }

    router.push('/dashboard/listings')
    router.refresh()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-[#222222]">
            Redigera tjänst
          </h1>
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mt-1">
            Det här är vad planerare ser när de besöker din tjänst
          </p>
        </div>
        <div className="flex gap-3">
          <SettingsButton variant="secondary" onClick={() => router.push('/dashboard')}>
            Avbryt
          </SettingsButton>
          <SettingsButton onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </SettingsButton>
        </div>
      </div>

      {error && (
        <div
          className="px-4 py-3 text-[14px]"
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <SettingsSection title="Titel">
            <SettingsInput
              id="service_title"
              label="Tjänstetitel"
              value={form.service_title}
              onChange={v => setForm(prev => ({ ...prev, service_title: v }))}
              placeholder="t.ex. Jazz-sångare, DJ, Makeupartist"
            />
          </SettingsSection>

          <SettingsSection title="Om tjänsten">
            <textarea
              value={form.service_description}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  service_description: e.target.value.slice(0, 500),
                }))
              }
              placeholder="Beskriv vad du erbjuder, din stil och vad arrangörer kan förvänta sig..."
              rows={5}
              className="w-full bg-white text-[#222222] text-[16px] leading-[1.5] placeholder:text-[#929292] focus:outline-none resize-none"
              style={{
                minHeight: 120,
                padding: '14px 12px',
                borderRadius: t.rounded.sm,
                border: `1px solid ${t.colors.hairline}`,
              }}
              onFocus={e => {
                e.currentTarget.style.border = `2px solid ${t.colors.ink}`
                e.currentTarget.style.padding = '13px 11px'
              }}
              onBlur={e => {
                e.currentTarget.style.border = `1px solid ${t.colors.hairline}`
                e.currentTarget.style.padding = '14px 12px'
              }}
            />
            <p className="text-[13px] text-[#929292] mt-1.5 text-right">
              {form.service_description.length}/500
            </p>
          </SettingsSection>

          <SettingsSection title="Kategori" description="Typ av tjänst — t.ex. DJ eller fotograf.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map(cat => {
                const active = form.category_slug === cat.slug
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        category_slug: cat.slug as CategorySlug,
                      }))
                    }
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-[14px] font-medium transition-colors',
                      active
                        ? 'border-[#222222] bg-[#f7f7f7] text-[#222222]'
                        : 'border-[#dddddd] text-[#222222] hover:border-[#222222]'
                    )}
                  >
                    <span aria-hidden>{cat.emoji}</span>
                    <span>{cat.chipLabel ?? cat.label}</span>
                  </button>
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Tillfällen"
            description="Vilka fester passar din tjänst? Planerare ser detta på din sida."
          >
            <OccasionMultiSelect
              value={form.occasions}
              onChange={occasions => setForm(prev => ({ ...prev, occasions }))}
            />
          </SettingsSection>

          <SettingsSection title="Prisintervall (SEK)">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <SettingsInput
                  id="price_min"
                  label="Från"
                  type="number"
                  min={0}
                  value={form.price_range_min}
                  onChange={v => setForm(prev => ({ ...prev, price_range_min: v }))}
                  placeholder="Från"
                />
              </div>
              <span className="pb-4 text-[#6a6a6a]">–</span>
              <div className="flex-1">
                <SettingsInput
                  id="price_max"
                  label="Till"
                  type="number"
                  min={0}
                  value={form.price_range_max}
                  onChange={v => setForm(prev => ({ ...prev, price_range_max: v }))}
                  placeholder="Till"
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Avbokningspolicy"
            description="Vad händer om planeraren avbokar? Visas på tjänsten och i offerter."
          >
            <div className="space-y-2">
              {CANCELLATION_POLICIES.map(policy => {
                const active = form.cancellation_policy === policy.id
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() =>
                      setForm(prev => ({ ...prev, cancellation_policy: policy.id }))
                    }
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                      active
                        ? 'border-[#222222] bg-[#f7f7f7]'
                        : 'border-[#dddddd] hover:border-[#222222]'
                    )}
                  >
                    <p className="text-[14px] font-semibold text-[#222222]">{policy.label}</p>
                    <p className="mt-0.5 text-[13px] text-[#6a6a6a]">{policy.short}</p>
                  </button>
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection title="Plats" description="Var erbjuder du din tjänst?">
            <LocationSelect
              value={form.location_id}
              onChange={location_id => setForm(prev => ({ ...prev, location_id }))}
              showComingSoon
            />
          </SettingsSection>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8">
            <SettingsSection title={`Foton · ${form.photos.length}/5`}>
              {form.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {form.photos.map((url, i) => (
                    <div
                      key={i}
                      className={`relative overflow-hidden bg-[#f2f2f2] ${
                        i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                      }`}
                      style={{ borderRadius: t.rounded.sm }}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes={i === 0 ? '320px' : '160px'}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="dark"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 hover:bg-black/70"
                        aria-label="Ta bort foto"
                      >
                        ×
                      </Button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">
                          Huvudbild
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.photos.length < 5 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-auto w-full flex-col gap-2 border-dashed py-8 text-[14px] text-muted-foreground hover:text-primary"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {uploading ? 'Laddar upp...' : 'Lägg till foton'}
                  </Button>
                </>
              )}

              <p className="mt-3 text-center text-[13px] text-muted-foreground">
                Första bilden är din profilbild i sökresultaten
              </p>
            </SettingsSection>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <SettingsButton variant="secondary" onClick={() => router.push('/dashboard')}>
          Avbryt
        </SettingsButton>
        <SettingsButton onClick={handleSave} disabled={saving || uploading}>
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </SettingsButton>
      </div>
    </div>
  )
}
