'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { PASSWORD_SET_METADATA_KEY } from '@/lib/auth-password'
import {
  COUNTRY_DIALS,
  formatPhoneDisplay,
  isValidE164,
  parseE164ToDialAndNational,
  toE164,
} from '@/lib/auth-identifier'
import { cn } from '@/lib/utils'
import {
  Bell,
  CreditCard,
  Lock,
  Shield,
  UserRound,
} from 'lucide-react'
import SettingsInput from './SettingsInput'
import SettingsToggle from './SettingsToggle'
import SettingsButton from './SettingsButton'
import SettingsRow from './SettingsRow'
import SettingsNavRow from './SettingsNavRow'
import PersonalInfoHelpCard from './PersonalInfoHelpCard'
import DeviceHistorySection from './DeviceHistorySection'
import SettingsSectionHeading from './SettingsSectionHeading'
import CookiePreferencesModal from './CookiePreferencesModal'
import ReadReceiptsLearnMore from './ReadReceiptsLearnMore'
import NotificationsSettings, { type NotificationPrefs } from './NotificationsSettings'
import PaymentsSettings from './PaymentsSettings'
import { settingsTokens as t } from './tokens'
import { settingsLayout as L } from './layout'

export type AccountSettingsProps = {
  email: string
  firstName: string
  lastName: string
  preferredFirstName: string
  phone: string
  authProvider: string | null
  notificationPrefs: NotificationPrefs
  privacyReadReceipts: boolean
  privacyReviewShowCity: boolean
  privacyReviewShowBookedServices: boolean
  role: 'planner' | 'provider'
  stripeOnboarded?: boolean
  stripeFlash?: string | null
  initialSection?: SettingsSection
}

export type SettingsSection =
  | 'personal'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'payments'

type Section = SettingsSection

function Msg({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null
  return (
    <p
      className="text-[13px] leading-[1.23] mt-2"
      style={{ color: msg.type === 'success' ? t.colors.success : t.colors.error }}
    >
      {msg.text}
    </p>
  )
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || local.length < 2) return email
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

/** Preferred defaults to first name when empty. */
function defaultPreferred(firstName: string, preferred: string): string {
  const trimmed = preferred.trim()
  if (trimmed) return trimmed
  return firstName.trim().split(/\s+/)[0] ?? ''
}

const NAV: { id: Section; label: string; icon: ReactNode }[] = [
  {
    id: 'personal',
    label: 'Personlig information',
    icon: <UserRound className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />,
  },
  {
    id: 'security',
    label: 'Inloggning & säkerhet',
    icon: <Shield className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />,
  },
  {
    id: 'privacy',
    label: 'Integritet',
    icon: <Lock className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />,
  },
  {
    id: 'notifications',
    label: 'Notifieringar',
    icon: <Bell className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />,
  },
  {
    id: 'payments',
    label: 'Betalningar',
    icon: <CreditCard className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />,
  },
]

export default function AccountSettingsForm({
  email,
  firstName,
  lastName,
  preferredFirstName,
  phone,
  authProvider,
  notificationPrefs,
  privacyReadReceipts,
  privacyReviewShowCity,
  privacyReviewShowBookedServices,
  role,
  stripeOnboarded = false,
  stripeFlash = null,
  initialSection = 'personal',
}: AccountSettingsProps) {
  const supabase = createClient()
  const isSocial =
    authProvider === 'google' || authProvider === 'facebook' || authProvider === 'apple'
  const socialName =
    authProvider === 'google' ? 'Google' : authProvider === 'facebook' ? 'Facebook' : 'Apple'

  const [section, setSection] = useState<Section>(initialSection)
  const [editing, setEditing] = useState<string | null>(null)
  const [cookieModalOpen, setCookieModalOpen] = useState(false)
  const [readReceiptsLearnMore, setReadReceiptsLearnMore] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [dataExportOpen, setDataExportOpen] = useState(false)

  const [newFirst, setNewFirst] = useState(firstName)
  const [newLast, setNewLast] = useState(lastName)
  const [savedFirst, setSavedFirst] = useState(firstName)
  const [savedLast, setSavedLast] = useState(lastName)

  const initialPreferred = defaultPreferred(firstName, preferredFirstName)
  const [newPreferred, setNewPreferred] = useState(initialPreferred)
  const [savedPreferred, setSavedPreferred] = useState(initialPreferred)

  const initialPhoneParts = parseE164ToDialAndNational(phone)
  const [phoneDial, setPhoneDial] = useState(initialPhoneParts.dial)
  const [newPhoneNational, setNewPhoneNational] = useState(initialPhoneParts.national)
  const [savedPhone, setSavedPhone] = useState(phone)
  const [newEmail, setNewEmail] = useState(email)

  const [newPassword, setNewPassword] = useState('')
  const [readReceipts, setReadReceipts] = useState(privacyReadReceipts)
  const [reviewShowCity, setReviewShowCity] = useState(privacyReviewShowCity)
  const [reviewShowServices, setReviewShowServices] = useState(privacyReviewShowBookedServices)

  const [saving, setSaving] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fullName = [savedFirst, savedLast].filter(Boolean).join(' ')
  const phoneDisplay = savedPhone ? formatPhoneDisplay(savedPhone) : null
  const phoneDescription =
    role === 'planner'
      ? 'Lägg till ett nummer så att talanger och Festly kan nå dig.'
      : 'Lägg till ett nummer så att planerare och Festly kan nå dig.'

  function openEdit(key: string) {
    setMsg(null)
    setEditing(prev => (prev === key ? null : key))
  }

  function switchSection(id: Section) {
    setSection(id)
    setEditing(null)
    setMsg(null)
    setConfirmDelete(false)
    setConfirmDeactivate(false)
  }

  async function handleSaveName() {
    if (!newFirst.trim()) return
    setSaving(true)
    setMsg(null)
    const nextFirst = newFirst.trim()
    const nextLast = newLast.trim()
    const fullName = [nextFirst, nextLast].filter(Boolean).join(' ')
    const preferredWasDefault =
      !savedPreferred || savedPreferred === defaultPreferred(savedFirst, '')
    const nextPreferred = preferredWasDefault
      ? defaultPreferred(nextFirst, '')
      : savedPreferred

    const { error } = await supabase
      .from('users')
      .update({
        first_name: nextFirst,
        last_name: nextLast || null,
        name: fullName,
        preferred_first_name: nextPreferred || null,
      })
      .eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
    } else {
      setSavedFirst(nextFirst)
      setSavedLast(nextLast)
      setSavedPreferred(nextPreferred)
      setNewPreferred(nextPreferred)
      setEditing(null)
      setMsg({ type: 'success', text: 'Namn uppdaterat!' })
    }
    setSaving(false)
  }

  async function handleSavePreferred() {
    const next = newPreferred.trim() || defaultPreferred(savedFirst, '')
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('users')
      .update({ preferred_first_name: next || null })
      .eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
    } else {
      setSavedPreferred(next)
      setEditing(null)
      setMsg({ type: 'success', text: 'Föredraget förnamn uppdaterat!' })
    }
    setSaving(false)
  }

  async function handleSavePhone() {
    const national = newPhoneNational.trim()
    if (!national) {
      setSaving(true)
      setMsg(null)
      const { error } = await supabase.from('users').update({ phone: null }).eq('email', email)
      if (error) {
        setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
      } else {
        setSavedPhone('')
        setPhoneDial(COUNTRY_DIALS[0].dial)
        setNewPhoneNational('')
        setEditing(null)
        setMsg({ type: 'success', text: 'Telefon uppdaterad!' })
      }
      setSaving(false)
      return
    }

    const e164 = toE164(phoneDial, national)
    if (!isValidE164(e164)) {
      setMsg({
        type: 'error',
        text: 'Ange ett giltigt telefonnummer. I Sverige kan du skriva 07… — nollan tas bort automatiskt med +46.',
      })
      return
    }

    setSaving(true)
    setMsg(null)
    const { error } = await supabase.from('users').update({ phone: e164 }).eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
    } else {
      const parts = parseE164ToDialAndNational(e164)
      setSavedPhone(e164)
      setPhoneDial(parts.dial)
      setNewPhoneNational(parts.national)
      setEditing(null)
      setMsg({ type: 'success', text: 'Telefon uppdaterad!' })
    }
    setSaving(false)
  }

  async function handleSaveEmail() {
    if (!newEmail.trim() || newEmail === email) return
    setSaving(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setMsg(
      error
        ? { type: 'error', text: 'Kunde inte uppdatera e-post. Försök igen.' }
        : { type: 'success', text: 'En bekräftelse har skickats till den nya adressen.' }
    )
    if (!error) setEditing(null)
    setSaving(false)
  }

  async function handleSavePassword() {
    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'Lösenordet måste vara minst 8 tecken.' })
      return
    }
    setSaving(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { [PASSWORD_SET_METADATA_KEY]: true },
    })
    if (error) {
      setMsg({ type: 'error', text: 'Kunde inte uppdatera lösenordet. Försök igen.' })
    } else {
      setMsg({ type: 'success', text: 'Lösenord uppdaterat!' })
      setNewPassword('')
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleDeactivateAccount() {
    setDeactivating(true)
    setMsg(null)
    try {
      const res = await fetch('/api/account/deactivate', { method: 'POST' })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte inaktivera kontot')
      window.location.href = '/?deactivated=1'
    } catch (e) {
      setMsg({
        type: 'error',
        text: e instanceof Error ? e.message : 'Kunde inte inaktivera kontot',
      })
      setDeactivating(false)
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    setMsg(null)
    try {
      const res = await fetch('/api/account/deactivate', { method: 'DELETE' })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte radera kontot')
      window.location.href = '/?deleted=1'
    } catch (e) {
      setMsg({
        type: 'error',
        text: e instanceof Error ? e.message : 'Kunde inte radera kontot',
      })
      setDeletingAccount(false)
    }
  }

  async function savePrivacyField(
    field:
      | 'privacy_read_receipts'
      | 'privacy_review_show_city'
      | 'privacy_review_show_booked_services',
    value: boolean
  ) {
    setMsg(null)
    const { error } = await supabase.from('users').update({ [field]: value }).eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Kunde inte spara. Försök igen.' })
      return false
    }
    return true
  }

  async function handleReadReceiptsChange(value: boolean) {
    const prev = readReceipts
    setReadReceipts(value)
    const ok = await savePrivacyField('privacy_read_receipts', value)
    if (!ok) setReadReceipts(prev)
  }

  async function handleReviewCityChange(value: boolean) {
    const prev = reviewShowCity
    setReviewShowCity(value)
    const ok = await savePrivacyField('privacy_review_show_city', value)
    if (!ok) setReviewShowCity(prev)
  }

  async function handleReviewServicesChange(value: boolean) {
    const prev = reviewShowServices
    setReviewShowServices(value)
    const ok = await savePrivacyField('privacy_review_show_booked_services', value)
    if (!ok) setReviewShowServices(prev)
  }

  async function handleRequestDataExport() {
    setExportingData(true)
    setMsg(null)
    try {
      const res = await fetch('/api/account/data-export', { method: 'POST' })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte begära export')
      setMsg({
        type: 'success',
        text: 'Exporten skickas till din e-post inom några minuter.',
      })
      setDataExportOpen(false)
    } catch (e) {
      setMsg({
        type: 'error',
        text: e instanceof Error ? e.message : 'Kunde inte begära export',
      })
    } finally {
      setExportingData(false)
    }
  }

  /**
   * Layout from settingsLayout tokens (inline styles — always applied).
   */
  return (
    <div
      data-settings-root
      className="grid w-full grid-cols-1 lg:items-start"
      style={{
        // Mobile: 1 col. Desktop widths set via gridTemplateColumns below in a media query-free way:
        // we rely on CSS grid + fixed nav width at lg using a style tag pattern via class + inline.
      }}
    >
      <style>{`
        @media (min-width: 1024px) {
          [data-settings-root] {
            grid-template-columns: ${L.navWidth}px minmax(0, 1fr);
          }
          [data-settings-nav] {
            border-right: 1px solid ${t.colors.hairlineSoft};
            padding-right: 24px;
          }
          [data-settings-detail] {
            padding-left: ${L.panelGap}px;
            padding-top: 0;
          }
        }
      `}</style>

      <aside data-settings-nav className="w-full">
        <h1 className="mb-6 text-[26px] font-semibold leading-[1.125] tracking-[-0.02em] text-[#222222] md:text-[32px]">
          Kontoinställningar
        </h1>
        <nav className="space-y-0.5 pb-2 lg:pb-0">
          {NAV.map(item => {
            const active = section === item.id
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                onClick={() => switchSection(item.id)}
                className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left text-[16px] font-normal text-foreground hover:bg-accent"
                style={{
                  fontWeight: active ? 600 : 400,
                  backgroundColor: active ? t.colors.surfaceSoft : 'transparent',
                  boxShadow: active ? `inset 0 0 0 1px ${t.colors.borderStrong}` : 'none',
                  transitionDuration: t.motion.fast,
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {item.label}
              </Button>
            )
          })}
        </nav>
      </aside>

      <section data-settings-detail className="min-w-0 pt-8">
        <div data-settings-form className="w-full" style={{ maxWidth: L.formMax }}>
        {section === 'personal' && (
          <>
            <h2 className="mb-2 text-[26px] font-semibold leading-[1.125] tracking-[-0.02em] text-[#222222] md:text-[32px]">
              Personlig information
            </h2>
            <Msg msg={msg} />

                <SettingsRow
                  label="Namn"
                  value={fullName || null}
                  actionLabel={fullName ? 'Redigera' : 'Lägg till'}
                  expanded={editing === 'name'}
                  onAction={() => {
                    setNewFirst(savedFirst)
                    setNewLast(savedLast)
                    openEdit('name')
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SettingsInput
                      id="first-name"
                      label="Förnamn"
                      value={newFirst}
                      onChange={setNewFirst}
                      autoComplete="given-name"
                    />
                    <SettingsInput
                      id="last-name"
                      label="Efternamn"
                      value={newLast}
                      onChange={setNewLast}
                      autoComplete="family-name"
                    />
                  </div>
                  <SettingsButton onClick={handleSaveName} disabled={saving || !newFirst.trim()}>
                    {saving ? 'Sparar...' : 'Spara'}
                  </SettingsButton>
                </SettingsRow>

                {role === 'planner' ? (
                  <SettingsRow
                    label="Föredraget förnamn"
                    value={savedPreferred || null}
                    actionLabel={savedPreferred ? 'Redigera' : 'Lägg till'}
                    expanded={editing === 'preferred'}
                    onAction={() => {
                      setNewPreferred(
                        savedPreferred || defaultPreferred(savedFirst, '')
                      )
                      openEdit('preferred')
                    }}
                  >
                    <SettingsInput
                      id="preferred-first-name"
                      label="Föredraget förnamn"
                      value={newPreferred}
                      onChange={setNewPreferred}
                      autoComplete="nickname"
                    />
                    <p className="text-[13px] leading-[1.4] text-[#6a6a6a]">
                      Visas för andra på Festly Om du lämnar det tomt används ditt förnamn.
                    </p>
                    <SettingsButton onClick={handleSavePreferred} disabled={saving}>
                      {saving ? 'Sparar...' : 'Spara'}
                    </SettingsButton>
                  </SettingsRow>
                ) : (
                  <div
                    className="py-6"
                    style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
                  >
                    <p className="text-[16px] font-semibold leading-[1.25] text-[#222222]">
                      Publik profil
                    </p>
                    <p className="mt-1 text-[14px] leading-[1.43] text-[#6a6a6a]">
                      Föredraget namn, profilbild och bio redigeras under{' '}
                      <Link
                        href="/dashboard/profile"
                        className="font-medium text-[#222222] underline"
                      >
                        Min profil
                      </Link>
                      .
                    </p>
                  </div>
                )}

                <SettingsRow
                  label="E-postadress"
                  value={maskEmail(email)}
                  actionLabel={isSocial ? 'Info' : 'Redigera'}
                  expanded={editing === 'email'}
                  onAction={() => openEdit('email')}
                >
                  {isSocial ? (
                    <p className="text-[14px] leading-[1.43] text-[#6a6a6a]">
                      Du är inloggad med {socialName}. E-postadressen hanteras av dem.
                    </p>
                  ) : (
                    <>
                      <SettingsInput
                        id="email"
                        label="E-post"
                        type="email"
                        value={newEmail}
                        onChange={setNewEmail}
                        autoComplete="email"
                      />
                      <SettingsButton
                        onClick={handleSaveEmail}
                        disabled={saving || newEmail === email || !newEmail.trim()}
                      >
                        {saving ? 'Sparar...' : 'Uppdatera e-post'}
                      </SettingsButton>
                    </>
                  )}
                </SettingsRow>

                <SettingsRow
                  label="Telefonnummer"
                  value={phoneDisplay}
                  description={savedPhone ? undefined : phoneDescription}
                  actionLabel={savedPhone ? 'Redigera' : 'Lägg till'}
                  expanded={editing === 'phone'}
                  onAction={() => {
                    const parts = parseE164ToDialAndNational(savedPhone)
                    setPhoneDial(parts.dial)
                    setNewPhoneNational(parts.national)
                    openEdit('phone')
                  }}
                  isLast
                >
                  <div>
                    <p className="mb-2 text-[13px] font-medium text-[#222222]">Telefon</p>
                    <div
                      className={cn(
                        'flex overflow-hidden rounded-xl border border-[#222222] bg-white'
                      )}
                    >
                      <label className="relative flex shrink-0 items-stretch border-r border-[#DDDDDD] bg-[#F7F7F7]">
                        <span className="sr-only">Landskod</span>
                        <select
                          value={phoneDial}
                          onChange={e => setPhoneDial(e.target.value)}
                          className="appearance-none bg-transparent py-3.5 pl-3.5 pr-8 text-[15px] font-medium text-[#222222] outline-none"
                          aria-label="Landskod"
                        >
                          {COUNTRY_DIALS.map(c => (
                            <option key={c.code} value={c.dial}>
                              {c.dial}
                            </option>
                          ))}
                        </select>
                        <span
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a6a6a]"
                          aria-hidden
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 4.5L6 8l3.5-3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </label>
                      <label className="flex min-h-[52px] min-w-0 flex-1 items-center px-3.5">
                        <input
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={newPhoneNational}
                          onChange={e => setNewPhoneNational(e.target.value)}
                          placeholder="070 123 45 67"
                          className="w-full bg-transparent text-[16px] text-[#222222] outline-none placeholder:text-[#B0B0B0]"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.4] text-[#6a6a6a]">
                      Skriv numret som du brukar, t.ex. 07… Nollan tas bort automatiskt när
                      landskoden är +46.
                    </p>
                  </div>
                  <SettingsButton onClick={handleSavePhone} disabled={saving}>
                    {saving ? 'Sparar...' : 'Spara'}
                  </SettingsButton>
                </SettingsRow>

            <PersonalInfoHelpCard />
          </>
        )}

        {section === 'security' && (
          <>
            <h2 className="mb-2 text-[26px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] md:text-[32px]">
              Inloggning & säkerhet
            </h2>
            <Msg msg={msg} />

            <SettingsSectionHeading title="Inloggning" className="!mt-8" />

            {!isSocial && (
              <SettingsRow
                label="Lösenord"
                value="••••••••"
                emptyLabel="Ej skapat"
                actionLabel="Uppdatera"
                expanded={editing === 'password'}
                onAction={() => {
                  setNewPassword('')
                  openEdit('password')
                }}
                isLast
              >
                <SettingsInput
                  id="password"
                  label="Nytt lösenord"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Minst 8 tecken"
                  autoComplete="new-password"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <SettingsButton
                    onClick={handleSavePassword}
                    disabled={saving || newPassword.length < 8}
                  >
                    {saving ? 'Sparar...' : 'Uppdatera lösenord'}
                  </SettingsButton>
                  {!resetSent ? (
                    <Button
                      type="button"
                      variant="link"
                      onClick={async () => {
                        setResetSent(true)
                        await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        })
                      }}
                      className="h-auto p-0 text-[14px] text-muted-foreground hover:text-primary"
                    >
                      Skicka återställningslänk
                    </Button>
                  ) : (
                    <p className="text-[13px] text-[#1D9E75]">Återställningslänk skickad!</p>
                  )}
                </div>
              </SettingsRow>
            )}

            {isSocial && (
              <SettingsRow
                label="Lösenord"
                value={null}
                emptyLabel="Ej skapat"
                actionLabel="Skapa"
                expanded={editing === 'password'}
                onAction={() => {
                  setNewPassword('')
                  openEdit('password')
                }}
                isLast
              >
                <p className="mb-3 text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                  Du loggar in via {socialName}. Du kan skapa ett lösenord om du vill kunna logga in med e-post också.
                </p>
                <SettingsInput
                  id="password"
                  label="Nytt lösenord"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Minst 8 tecken"
                  autoComplete="new-password"
                />
                <SettingsButton
                  onClick={handleSavePassword}
                  disabled={saving || newPassword.length < 8}
                >
                  {saving ? 'Sparar...' : 'Skapa lösenord'}
                </SettingsButton>
              </SettingsRow>
            )}

            <SettingsSectionHeading title="Sociala konton" />
            <SettingsRow
              label={isSocial ? socialName : 'Google'}
              value={isSocial ? 'Anslutet' : 'Ej anslutet'}
              actionLabel={isSocial ? 'Info' : 'Anslut'}
              expanded={editing === 'method'}
              onAction={() => openEdit('method')}
              isLast
            >
              <p className="text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                {isSocial
                  ? `Du loggar in via ${socialName}. Lösenord och e-post hanteras där.`
                  : 'Anslut Google för snabbare inloggning (kommer snart).'}
              </p>
            </SettingsRow>

            <DeviceHistorySection />

            <SettingsSectionHeading title="Konto" />
            <SettingsRow
              label="Inaktivera konto"
              value={null}
              description="Tillfälligt stäng av ditt konto. Du loggas ut från alla enheter. Kontakta oss om du vill aktivera det igen."
              actionLabel={confirmDeactivate ? 'Avbryt' : 'Inaktivera'}
              expanded={confirmDeactivate}
              onAction={() => setConfirmDeactivate(prev => !prev)}
              isLast
            >
              <p className="text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                Är du säker? Du kan inte logga in förrän kontot aktiveras igen.
              </p>
              <SettingsButton
                variant="dangerOutline"
                onClick={handleDeactivateAccount}
                disabled={deactivating}
              >
                {deactivating ? 'Inaktiverar…' : 'Ja, inaktivera mitt konto'}
              </SettingsButton>
            </SettingsRow>
          </>
        )}

        {section === 'privacy' && (
          <>
            <h2 className="mb-2 text-[26px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] md:text-[32px]">
              Integritet
            </h2>
            <Msg msg={msg} />

            {/* Airbnb Privacy: no underline under titles — hairline AFTER each section */}
            <section
              className="pt-8"
              style={{
                borderBottom: `1px solid ${t.colors.hairlineSoft}`,
                paddingBottom: 32,
              }}
            >
              <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#222222]">
                Meddelanden
              </h3>
              <div className="pt-6">
                <SettingsToggle
                  variant="ink"
                  label="Visa för andra när jag har läst deras meddelanden"
                  checked={readReceipts}
                  onChange={handleReadReceiptsChange}
                  learnMore={{
                    label: 'Läs mer',
                    onClick: () => setReadReceiptsLearnMore(true),
                  }}
                />
              </div>
            </section>

            <section
              className="pt-10"
              style={{
                borderBottom: `1px solid ${t.colors.hairlineSoft}`,
                paddingBottom: 32,
              }}
            >
              <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#222222]">
                Recensioner
              </h3>
              <p className="mt-3 text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                Dessa inställningar styr vad som visas tillsammans med recensioner du skriver.
              </p>
              <div
                className="pt-6"
                style={{
                  borderBottom: `1px solid ${t.colors.hairlineSoft}`,
                  paddingBottom: 24,
                }}
              >
                <SettingsToggle
                  variant="ink"
                  label="Visa min hemstad"
                  description="Ex: Stockholm, Sverige"
                  checked={reviewShowCity}
                  onChange={handleReviewCityChange}
                />
              </div>
              <div className="pt-6">
                <SettingsToggle
                  variant="ink"
                  label="Visa bokade tjänster"
                  description="Ex: DJ · Bröllop"
                  checked={reviewShowServices}
                  onChange={handleReviewServicesChange}
                />
              </div>
            </section>

            <section className="pt-10">
              <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#222222]">
                Datasekretess
              </h3>
              <div className="mt-6 flex flex-col gap-4">
                {dataExportOpen ? (
                  <div
                    style={{
                      border: `1px solid ${t.colors.hairlineSoft}`,
                      borderRadius: 12,
                      padding: 20,
                      backgroundColor: t.colors.canvas,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <p className="text-[16px] font-semibold text-[#222222]">
                        Begär mina personuppgifter
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setDataExportOpen(false)}
                        className="h-auto p-0 text-[14px] font-medium underline"
                      >
                        Avbryt
                      </Button>
                    </div>
                    <p className="mb-4 text-[14px] leading-[1.43] text-[#6a6a6a]">
                      Vi samlar din kontodata, bokningar, meddelanden och recensioner i en JSON-fil
                      och skickar den till <strong className="text-[#222222]">{email}</strong>. Det
                      kan ta några minuter.
                    </p>
                    <SettingsButton onClick={handleRequestDataExport} disabled={exportingData}>
                      {exportingData ? 'Skickar begäran…' : 'Skicka export till min e-post'}
                    </SettingsButton>
                  </div>
                ) : (
                  <SettingsNavRow
                    asCard
                    label="Begär mina personuppgifter"
                    onClick={() => {
                      setConfirmDelete(false)
                      setDataExportOpen(true)
                    }}
                  />
                )}

                <SettingsNavRow
                  asCard
                  label="Cookie-preferenser"
                  description="Välj vilka cookies du vill tillåta på Festly"
                  onClick={() => setCookieModalOpen(true)}
                />

                {confirmDelete ? (
                  <div
                    style={{
                      border: `1px solid ${t.colors.hairlineSoft}`,
                      borderRadius: 12,
                      padding: 20,
                      backgroundColor: t.colors.canvas,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <p className="text-[16px] font-semibold text-[#222222]">Radera mitt konto</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setConfirmDelete(false)}
                        className="h-auto p-0 text-[14px] font-medium underline"
                      >
                        Avbryt
                      </Button>
                    </div>
                    <p className="mb-4 text-[14px] leading-[1.43] text-[#6a6a6a]">
                      Raderar ditt konto och all data permanent. Detta går inte att ångra. För att
                      bara pausa kontot, använd Inaktivera under Inloggning & säkerhet.
                    </p>
                    <SettingsButton
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? 'Raderar…' : 'Ja, radera mitt konto permanent'}
                    </SettingsButton>
                  </div>
                ) : (
                  <SettingsNavRow
                    asCard
                    label="Radera mitt konto"
                    onClick={() => {
                      setDataExportOpen(false)
                      setConfirmDelete(true)
                    }}
                  />
                )}
              </div>

              <div
                className="mt-6 flex gap-4 rounded-xl p-5"
                style={{
                  backgroundColor: t.colors.surfaceSoft,
                  border: `1px solid ${t.colors.hairlineSoft}`,
                }}
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#FFE8E0' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="#FF2E8A"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M8 11V8a4 4 0 0 1 8 0v3"
                      stroke="#FF2E8A"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#222222]">
                    Vi värnar din integritet
                  </p>
                  <p className="mt-1 text-[14px] leading-[1.43] text-[#6a6a6a]">
                    Läs mer i vår{' '}
                    <Link href="/privacy" className="underline text-[#222222]">
                      integritetspolicy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            <ReadReceiptsLearnMore
              open={readReceiptsLearnMore}
              onClose={() => setReadReceiptsLearnMore(false)}
            />
            <CookiePreferencesModal
              open={cookieModalOpen}
              onClose={() => setCookieModalOpen(false)}
            />
          </>
        )}

        {section === 'notifications' && (
          <NotificationsSettings
            email={email}
            initial={notificationPrefs}
            role={role}
          />
        )}

        {section === 'payments' && (
          <PaymentsSettings
            role={role}
            paymentsHref={role === 'provider' ? '/dashboard/payments' : '/planner/payments'}
            firstName={savedFirst}
            lastName={savedLast}
            stripeOnboarded={stripeOnboarded}
            stripeFlash={stripeFlash}
          />
        )}
        </div>
      </section>
    </div>
  )
}
