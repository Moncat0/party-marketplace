'use client'

import { useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import SettingsInput from './SettingsInput'
import SettingsToggle from './SettingsToggle'
import SettingsButton from './SettingsButton'
import SettingsRow from './SettingsRow'
import { settingsTokens as t } from './tokens'

export type AccountSettingsProps = {
  email: string
  firstName: string
  lastName: string
  phone: string
  authProvider: string | null
  notifMarketing: boolean
  role: 'planner' | 'provider'
}

type Section = 'personal' | 'security' | 'notifications' | 'danger'

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

const plannerAlwaysOn = [
  'Bekräftelse när en talang accepterar din bokning',
  'Meddelande om avböjd förfrågan',
  'Ny konversation eller meddelande',
  'Påminnelse att lämna omdöme efter eventet',
]

const providerAlwaysOn = [
  'Ny bokningsförfrågan från en planerare',
  'Nya meddelanden i en konversation',
  'Påminnelse att lämna omdöme efter eventet',
]

const NAV: { id: Section; label: string; icon: ReactNode }[] = [
  {
    id: 'personal',
    label: 'Personlig information',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Inloggning & säkerhet',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifieringar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'danger',
    label: 'Radera konto',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
]

export default function AccountSettingsForm({
  email,
  firstName,
  lastName,
  phone,
  authProvider,
  notifMarketing,
  role,
}: AccountSettingsProps) {
  const supabase = createClient()
  const isSocial =
    authProvider === 'google' || authProvider === 'facebook' || authProvider === 'apple'
  const socialName =
    authProvider === 'google' ? 'Google' : authProvider === 'facebook' ? 'Facebook' : 'Apple'

  const [section, setSection] = useState<Section>('personal')
  const [editing, setEditing] = useState<string | null>(null)

  const [newFirst, setNewFirst] = useState(firstName)
  const [newLast, setNewLast] = useState(lastName)
  const [savedFirst, setSavedFirst] = useState(firstName)
  const [savedLast, setSavedLast] = useState(lastName)
  const [newPhone, setNewPhone] = useState(phone)
  const [savedPhone, setSavedPhone] = useState(phone)
  const [newEmail, setNewEmail] = useState(email)
  const [newPassword, setNewPassword] = useState('')
  const [marketing, setMarketing] = useState(notifMarketing)

  const [saving, setSaving] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const legalName = [savedFirst, savedLast].filter(Boolean).join(' ')
  const alwaysOn = role === 'provider' ? providerAlwaysOn : plannerAlwaysOn

  function openEdit(key: string) {
    setMsg(null)
    setEditing(prev => (prev === key ? null : key))
  }

  function switchSection(id: Section) {
    setSection(id)
    setEditing(null)
    setMsg(null)
    setConfirmDelete(false)
  }

  async function handleSaveName() {
    if (!newFirst.trim()) return
    setSaving(true)
    setMsg(null)
    const fullName = [newFirst.trim(), newLast.trim()].filter(Boolean).join(' ')
    const { error } = await supabase
      .from('users')
      .update({
        first_name: newFirst.trim(),
        last_name: newLast.trim() || null,
        name: fullName,
      })
      .eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
    } else {
      setSavedFirst(newFirst.trim())
      setSavedLast(newLast.trim())
      setEditing(null)
      setMsg({ type: 'success', text: 'Namn uppdaterat!' })
    }
    setSaving(false)
  }

  async function handleSavePhone() {
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('users')
      .update({ phone: newPhone.trim() || null })
      .eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Något gick fel. Försök igen.' })
    } else {
      setSavedPhone(newPhone.trim())
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
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMsg({ type: 'error', text: 'Kunde inte uppdatera lösenordet. Försök igen.' })
    } else {
      setMsg({ type: 'success', text: 'Lösenord uppdaterat!' })
      setNewPassword('')
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleSaveNotifs() {
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('users')
      .update({ notif_marketing: marketing })
      .eq('email', email)
    setMsg(
      error
        ? { type: 'error', text: 'Något gick fel. Försök igen.' }
        : { type: 'success', text: 'Inställningar sparade!' }
    )
    setSaving(false)
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    await supabase.auth.signOut()
    window.location.href = '/?deleted=1'
  }

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-0">
      {/* Left rail — left edge of Container */}
      <aside
        className="w-full lg:w-[300px] xl:w-[320px] flex-shrink-0 lg:pr-8 lg:mr-10 lg:border-r"
        style={{ borderColor: t.colors.hairlineSoft }}
      >
        <h1 className="text-[26px] md:text-[32px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] mb-5">
          Kontoinställningar
        </h1>
        <nav className="space-y-0.5 pb-2 lg:pb-0">
          {NAV.map(item => {
            const active = section === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchSection(item.id)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left text-[16px] transition-colors"
                style={{
                  borderRadius: 12,
                  fontWeight: active ? 600 : 400,
                  color: t.colors.ink,
                  backgroundColor: active ? t.colors.surfaceSoft : 'transparent',
                  transitionDuration: t.motion.fast,
                }}
              >
                <span className="flex-shrink-0 text-[#222222]">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main content — fills rest of Container (same shell as rail) */}
      <div className="flex-1 min-w-0 w-full max-w-[720px] lg:max-w-none">
        {section === 'personal' && (
          <>
            <h2 className="text-[26px] md:text-[32px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] mb-2">
              Personlig information
            </h2>
            <Msg msg={msg} />

              <SettingsRow
                label="Juridiskt namn"
                value={legalName || null}
                actionLabel={legalName ? 'Redigera' : 'Lägg till'}
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
                value={savedPhone || null}
                description={
                  role === 'planner'
                    ? 'Läggs till i din profil så att talanger kan kontakta dig vid en aktiv bokning.'
                    : 'Läggs till i din profil så att planerare kan kontakta dig vid en aktiv bokning.'
                }
                actionLabel={savedPhone ? 'Redigera' : 'Lägg till'}
                expanded={editing === 'phone'}
                onAction={() => {
                  setNewPhone(savedPhone)
                  openEdit('phone')
                }}
                isLast
              >
                <SettingsInput
                  id="phone"
                  label="Telefon"
                  type="tel"
                  value={newPhone}
                  onChange={setNewPhone}
                  placeholder="+46 70 123 45 67"
                  autoComplete="tel"
                />
                <SettingsButton onClick={handleSavePhone} disabled={saving}>
                  {saving ? 'Sparar...' : 'Spara'}
                </SettingsButton>
              </SettingsRow>

              <div
                className="mt-10 flex gap-4 p-6"
                style={{
                  borderRadius: t.rounded.md,
                  border: `1px solid ${t.colors.hairline}`,
                }}
              >
                <div className="flex-shrink-0 text-[#DE3151] mt-0.5" aria-hidden>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="8" y="14" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.75" />
                    <path
                      d="M14 14v-3a6 6 0 0 1 12 0v3"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="23" r="2" fill="currentColor" />
                    <path d="M20 25v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[16px] font-medium text-[#222222]">
                    Varför syns inte all info här?
                  </p>
                  <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mt-1">
                    Vi döljer vissa kontouppgifter för att skydda din identitet.
                  </p>
                </div>
              </div>
            </>
          )}

          {section === 'security' && (
            <>
              <h2 className="text-[26px] md:text-[32px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] mb-2">
                Inloggning & säkerhet
              </h2>
              <Msg msg={msg} />

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
                      <button
                        type="button"
                        onClick={async () => {
                          setResetSent(true)
                          await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/reset-password`,
                          })
                        }}
                        className="text-[14px] text-[#6a6a6a] hover:text-[#FF6B35] underline-offset-2 hover:underline"
                      >
                        Skicka återställningslänk
                      </button>
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
                >
                  <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-3">
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

              <h3 className="text-[22px] font-medium text-[#222222] mt-10 mb-1 tracking-[-0.02em]">
                Sociala konton
              </h3>
              <SettingsRow
                label={isSocial ? socialName : 'Google'}
                value={isSocial ? 'Anslutet' : 'Ej anslutet'}
                actionLabel={isSocial ? 'Info' : 'Anslut'}
                expanded={editing === 'method'}
                onAction={() => openEdit('method')}
                isLast
              >
                <p className="text-[14px] leading-[1.43] text-[#6a6a6a]">
                  {isSocial
                    ? `Du loggar in via ${socialName}. Lösenord och e-post hanteras där.`
                    : 'Anslut Google för snabbare inloggning (kommer snart).'}
                </p>
              </SettingsRow>

              <h3 className="text-[22px] font-medium text-[#222222] mt-10 mb-1 tracking-[-0.02em]">
                Konto
              </h3>
              <SettingsRow
                label="Radera konto"
                value={null}
                emptyLabel="Denna åtgärd kan inte ångras."
                actionLabel="Radera"
                expanded={false}
                onAction={() => switchSection('danger')}
                isLast
              />
            </>
          )}

          {section === 'notifications' && (
            <>
              <h2 className="text-[26px] md:text-[32px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] mb-6">
                Notifieringar
              </h2>
              <Msg msg={msg} />

              <div
                className="mb-8 px-4 py-4"
                style={{
                  backgroundColor: t.colors.surfaceSoft,
                  borderRadius: t.rounded.sm,
                }}
              >
                <p className="text-[14px] font-medium text-[#222222] mb-2">
                  Alltid aktivt — kan inte stängas av
                </p>
                <ul className="space-y-1.5 text-[14px] leading-[1.43] text-[#6a6a6a]">
                  {alwaysOn.map(item => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
                <p className="text-[13px] text-[#929292] mt-2">
                  Dessa mejl är nödvändiga för att tjänsten ska fungera.
                </p>
              </div>

              <div
                style={{
                  borderTop: `1px solid ${t.colors.hairlineSoft}`,
                  paddingTop: 24,
                }}
              >
                <SettingsToggle
                  label="Marknadsföringsmejl"
                  description="Tips, inspiration och nyheter från FESTEN."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>

              <div className="mt-6">
                <SettingsButton variant="dark" onClick={handleSaveNotifs} disabled={saving}>
                  {saving ? 'Sparar...' : 'Spara'}
                </SettingsButton>
              </div>
            </>
          )}

          {section === 'danger' && (
            <>
              <h2 className="text-[26px] md:text-[32px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] mb-2">
                Radera konto
              </h2>
              <p className="text-[16px] leading-[1.43] text-[#6a6a6a] mb-8 max-w-lg">
                All din data raderas permanent. Detta går inte att ångra.
              </p>
              {!confirmDelete ? (
                <SettingsButton variant="dangerOutline" onClick={() => setConfirmDelete(true)}>
                  Radera mitt konto
                </SettingsButton>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <SettingsButton
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? 'Raderar...' : 'Ja, radera mitt konto'}
                  </SettingsButton>
                  <SettingsButton variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Avbryt
                  </SettingsButton>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  )
}
