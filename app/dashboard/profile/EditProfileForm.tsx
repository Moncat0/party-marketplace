'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
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

type Profile = {
  id: string
  service_title: string | null
  service_description: string | null
  category_tags: string[]
  city: string | null
  location_id?: string | null
  price_range_min: number | null
  price_range_max: number | null
  photos: string[]
}

const CATEGORY_SUGGESTIONS = [
  'Sångare', 'DJ', 'Fotograf', 'Makeupartist', 'Kock',
  'Underhållare', 'Dansare', 'Musiker', 'Trollkarl', 'Ballongkonstnär',
]

export default function EditProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    service_title: profile.service_title ?? '',
    service_description: profile.service_description ?? '',
    category_tags: profile.category_tags ?? [],
    location_id: profile.location_id ?? locationIdFromCity(profile.city) ?? DEFAULT_LOCATION_ID,
    price_range_min: profile.price_range_min?.toString() ?? '',
    price_range_max: profile.price_range_max?.toString() ?? '',
    photos: profile.photos ?? [],
  })

  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addTag(tag: string) {
    const cleaned = tag.trim().replace(/,$/, '')
    if (!cleaned || form.category_tags.includes(cleaned)) {
      setTagInput('')
      return
    }
    setForm(prev => ({ ...prev, category_tags: [...prev.category_tags, cleaned] }))
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm(prev => ({ ...prev, category_tags: prev.category_tags.filter(tg => tg !== tag) }))
  }

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
    setSaving(true)
    setError(null)
    setSaved(false)
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({
        service_title: form.service_title || null,
        service_description: form.service_description || null,
        category_tags: form.category_tags,
        city: getLocationLabel(form.location_id),
        location_id: form.location_id,
        price_range_min: form.price_range_min ? Number(form.price_range_min) : null,
        price_range_max: form.price_range_max ? Number(form.price_range_max) : null,
        photos: form.photos,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError('Något gick fel. Försök igen.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-[#222222]">
            Redigera profil
          </h1>
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mt-1">
            Det här är vad planerare ser när de besöker din sida
          </p>
        </div>
        <div className="flex gap-3">
          <SettingsButton variant="secondary" onClick={() => router.push('/dashboard')}>
            Avbryt
          </SettingsButton>
          <SettingsButton onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'Sparar...' : saved ? 'Sparat ✓' : 'Spara ändringar'}
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

          <SettingsSection title="Om dig">
            <textarea
              value={form.service_description}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  service_description: e.target.value.slice(0, 500),
                }))
              }
              placeholder="Beskriv din tjänst, din stil och vad arrangörer kan förvänta sig..."
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

          <SettingsSection title="Taggar">
            {form.category_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.category_tags.map(tag => (
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
                      className="text-white/70 hover:text-white leading-none ml-0.5"
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
              placeholder="Lägg till tagg och tryck Enter..."
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.filter(s => !form.category_tags.includes(s)).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  className="px-3 py-1 text-[12px] text-[#6a6a6a] hover:text-[#FF6B35] transition-colors"
                  style={{
                    borderRadius: t.rounded.full,
                    border: `1px solid ${t.colors.hairline}`,
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
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
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 text-xs text-white hover:bg-black/70 flex items-center justify-center"
                      >
                        ×
                      </button>
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-8 text-[14px] text-[#6a6a6a] hover:text-[#FF6B35] transition-colors disabled:opacity-50 flex flex-col items-center gap-2"
                    style={{
                      borderRadius: t.rounded.sm,
                      border: `2px dashed ${t.colors.hairline}`,
                    }}
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
                  </button>
                </>
              )}

              <p className="text-[13px] text-[#929292] mt-3 text-center">
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
          {saving ? 'Sparar...' : saved ? 'Sparat ✓' : 'Spara ändringar'}
        </SettingsButton>
      </div>
    </div>
  )
}
