'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsInput from '@/components/settings/SettingsInput'
import SettingsButton from '@/components/settings/SettingsButton'
import { Button } from '@/components/ui/button'
import { settingsTokens as t } from '@/components/settings/tokens'
import { hostDisplayName } from '@/lib/host-display-name'
import LocationSelect from '@/components/ui/LocationSelect'
import { DEFAULT_LOCATION_ID, getLocationLabel } from '@/lib/locations'

type Props = {
  userId: string
  firstName: string
  lastName: string
  preferredFirstName: string
  avatarUrl: string | null
  bio: string
  basedInLocationId: string | null
}

export default function HostProfileForm({
  userId,
  firstName,
  lastName,
  preferredFirstName,
  avatarUrl,
  bio,
  basedInLocationId,
}: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialPreferred = preferredFirstName.trim() || firstName.trim()
  const [preferred, setPreferred] = useState(initialPreferred)
  const [bioValue, setBioValue] = useState(bio)
  const [locationId, setLocationId] = useState(
    basedInLocationId?.trim() || DEFAULT_LOCATION_ID
  )
  const [avatar, setAvatar] = useState(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const previewName = hostDisplayName({
    preferred_first_name: preferred,
    first_name: firstName,
    last_name: lastName,
  })

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('provider-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const url = supabase.storage.from('provider-photos').getPublicUrl(path).data.publicUrl
      setAvatar(url)
    } catch {
      setMsg({ type: 'error', text: 'Det gick inte att ladda upp bilden.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    const nextPreferred = preferred.trim() || firstName.trim()
    if (!nextPreferred) {
      setMsg({ type: 'error', text: 'Ange ett föredraget förnamn.' })
      return
    }

    setSaving(true)
    setMsg(null)

    const { error: userError } = await supabase
      .from('users')
      .update({
        preferred_first_name: nextPreferred,
        avatar_url: avatar || null,
      })
      .eq('id', userId)

    if (userError) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
      setSaving(false)
      return
    }

    const trimmedBio = bioValue.trim()
    const nextLocationId = locationId || DEFAULT_LOCATION_ID
    const { error: bioError } = await supabase
      .from('provider_profiles')
      .update({
        bio: trimmedBio || null,
        location_id: nextLocationId,
        city: getLocationLabel(nextLocationId),
      })
      .eq('user_id', userId)

    if (bioError) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
      setSaving(false)
      return
    }

    setPreferred(nextPreferred)
    setBioValue(trimmedBio)
    setLocationId(nextLocationId)
    setMsg({ type: 'success', text: 'Profilen sparad!' })
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-[#222222]">
            Min profil
          </h1>
          <p className="mt-1 text-[14px] leading-[1.43] text-[#6a6a6a]">
            Så här syns du för planerare på dina tjänster
          </p>
        </div>
        <SettingsButton onClick={() => void handleSave()} disabled={saving || uploading}>
          {saving ? 'Sparar...' : 'Spara'}
        </SettingsButton>
      </div>

      {msg && (
        <p
          className="text-[14px]"
          style={{ color: msg.type === 'success' ? t.colors.success : t.colors.error }}
        >
          {msg.text}
        </p>
      )}

      <SettingsSection title="Profilbild" description="Visas bredvid ditt namn på tjänstesidor.">
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-[#f2f2f2]">
            {avatar ? (
              <Image src={avatar} alt="" fill className="object-cover" sizes="96px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[28px] font-semibold text-[#6a6a6a]">
                {(previewName || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => void handleAvatarSelect(e)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-auto gap-2 rounded-xl px-4 py-2.5 text-[14px]"
            >
              <Camera className="size-4" strokeWidth={2} aria-hidden />
              {uploading ? 'Laddar upp...' : avatar ? 'Byt bild' : 'Ladda upp bild'}
            </Button>
            {avatar ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAvatar(null)}
                className="h-auto justify-start gap-2 px-2 py-1.5 text-[13px] text-muted-foreground"
              >
                <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
                Ta bort
              </Button>
            ) : null}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Föredraget förnamn"
        description="Det namn planerare ser. Standard är ditt förnamn."
      >
        <SettingsInput
          id="preferred-first-name"
          label="Föredraget förnamn"
          value={preferred}
          onChange={setPreferred}
          autoComplete="nickname"
        />
        <p className="mt-3 text-[13px] leading-[1.4] text-[#6a6a6a]">
          Förhandsvisning: <span className="font-medium text-[#222222]">{previewName || '—'}</span>
        </p>
      </SettingsSection>

      <SettingsSection title="Om mig" description="En kort presentation av dig som talang.">
        <textarea
          value={bioValue}
          onChange={e => setBioValue(e.target.value.slice(0, 600))}
          placeholder="Berätta om dig själv, din stil och vad du tycker om med fester..."
          rows={6}
          maxLength={600}
          className="w-full resize-none bg-white text-[16px] leading-[1.5] text-[#222222] placeholder:text-[#929292] focus:outline-none"
          style={{
            minHeight: 140,
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
        <p className="mt-1.5 text-right text-[13px] text-[#929292]">{bioValue.trim().length}/600</p>
      </SettingsSection>

      <SettingsSection
        title="Baserad i"
        description="Var du är baserad — planerare använder det för att hitta lokal talent."
      >
        <LocationSelect value={locationId} onChange={setLocationId} showComingSoon />
      </SettingsSection>

      <p className="text-[13px] leading-[1.4] text-[#6a6a6a]">
        Ändra telefon eller juridiskt namn under{' '}
        <Link href="/dashboard/account" className="font-medium text-[#222222] underline">
          Kontoinställningar
        </Link>
        .
      </p>

      <div className="flex justify-end">
        <SettingsButton onClick={() => void handleSave()} disabled={saving || uploading}>
          {saving ? 'Sparar...' : 'Spara'}
        </SettingsButton>
      </div>
    </div>
  )
}
