'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

type Profile = {
  id: string
  service_title: string | null
  service_description: string | null
  category_tags: string[]
  city: string | null
  price_range_min: number | null
  price_range_max: number | null
  photos: string[]
}

const CATEGORY_SUGGESTIONS = [
  'Sångare', 'DJ', 'Fotograf', 'Makeupartist', 'Kock',
  'Underhållare', 'Dansare', 'Musiker', 'Trollkarl', 'Ballongkonstnär',
]

const inputClass = 'w-full rounded-xl border border-[#EBEBEB] bg-[#F7F7F7] px-4 py-2.5 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] transition-colors'

export default function EditProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    service_title: profile.service_title ?? '',
    service_description: profile.service_description ?? '',
    category_tags: profile.category_tags ?? [],
    city: profile.city ?? 'Stockholm',
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
    if (!cleaned || form.category_tags.includes(cleaned)) { setTagInput(''); return }
    setForm(prev => ({ ...prev, category_tags: [...prev.category_tags, cleaned] }))
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm(prev => ({ ...prev, category_tags: prev.category_tags.filter(t => t !== tag) }))
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
      const urls = await Promise.all(toUpload.map(async (file) => {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('provider-photos').upload(path, file, { upsert: false })
        if (uploadError) throw uploadError
        return supabase.storage.from('provider-photos').getPublicUrl(path).data.publicUrl
      }))
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
    const { error: updateError } = await supabase.from('provider_profiles').update({
      service_title: form.service_title || null,
      service_description: form.service_description || null,
      category_tags: form.category_tags,
      city: form.city || null,
      price_range_min: form.price_range_min ? Number(form.price_range_min) : null,
      price_range_max: form.price_range_max ? Number(form.price_range_max) : null,
      photos: form.photos,
    }).eq('id', profile.id)

    if (updateError) {
      setError('Något gick fel. Försök igen.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Redigera profil</h1>
          <p className="text-sm text-[#717171] mt-1">Det här är vad planerare ser när de besöker din sida</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="rounded-xl border border-[#EBEBEB] px-5 py-2.5 text-sm font-medium text-[#717171] hover:bg-[#F7F7F7] transition-colors">
            Avbryt
          </button>
          <button onClick={handleSave} disabled={saving || uploading}
            className="rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40">
            {saving ? 'Sparar...' : saved ? 'Sparat ✓' : 'Spara ändringar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-6">

        {/* Left column — text fields */}
        <div className="col-span-3 space-y-4">

          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">Titel</label>
            <input type="text" value={form.service_title}
              onChange={e => setForm(prev => ({ ...prev, service_title: e.target.value }))}
              placeholder="t.ex. Jazz-sångare, DJ, Makeupartist"
              className={inputClass} />
          </div>

          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#1A1A2E]">Om dig</label>
              <span className="text-xs text-[#A0A0A0]">{form.service_description.length}/500</span>
            </div>
            <textarea value={form.service_description}
              onChange={e => setForm(prev => ({ ...prev, service_description: e.target.value.slice(0, 500) }))}
              placeholder="Beskriv din tjänst, din stil och vad arrangörer kan förvänta sig..."
              rows={5}
              className={`${inputClass} resize-none`} />
          </div>

          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">Taggar</label>
            {form.category_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.category_tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-[#FF6B35] px-3 py-1 text-sm text-white">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-white/70 hover:text-white leading-none ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
            <input type="text" value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
              placeholder="Lägg till tagg och tryck Enter..."
              className={inputClass} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.filter(s => !form.category_tags.includes(s)).map(s => (
                <button key={s} onClick={() => addTag(s)}
                  className="rounded-full border border-[#EBEBEB] px-3 py-1 text-xs text-[#717171] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">Prisintervall (SEK)</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" value={form.price_range_min}
                onChange={e => setForm(prev => ({ ...prev, price_range_min: e.target.value }))}
                placeholder="Från" className={inputClass} />
              <span className="text-[#717171] flex-shrink-0">–</span>
              <input type="number" min="0" value={form.price_range_max}
                onChange={e => setForm(prev => ({ ...prev, price_range_max: e.target.value }))}
                placeholder="Till" className={inputClass} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">Stad</label>
            <input type="text" value={form.city}
              onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Stockholm" className={inputClass} />
          </div>
        </div>

        {/* Right column — photos */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-[#1A1A2E]">Foton</label>
              <span className="text-xs text-[#717171]">{form.photos.length}/5</span>
            </div>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {form.photos.map((url, i) => (
                  <div key={i} className={`relative rounded-xl overflow-hidden bg-[#F7F7F7] ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                    <Image src={url} alt="" fill className="object-cover" sizes={i === 0 ? '320px' : '160px'} />
                    <button onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 text-xs text-white hover:bg-black/70 flex items-center justify-center">
                      ×
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">Huvudbild</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.photos.length < 5 && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-[#EBEBEB] py-8 text-sm text-[#717171] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors disabled:opacity-50 flex flex-col items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {uploading ? 'Laddar upp...' : 'Lägg till foton'}
                </button>
              </>
            )}

            <p className="text-xs text-[#A0A0A0] mt-3 text-center">Första bilden är din profilbild i sökresultaten</p>
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={() => router.push('/dashboard')}
          className="rounded-xl border border-[#EBEBEB] px-5 py-2.5 text-sm font-medium text-[#717171] hover:bg-[#F7F7F7] transition-colors">
          Avbryt
        </button>
        <button onClick={handleSave} disabled={saving || uploading}
          className="rounded-xl bg-[#FF6B35] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40">
          {saving ? 'Sparar...' : saved ? 'Sparat ✓' : 'Spara ändringar'}
        </button>
      </div>
    </div>
  )
}
