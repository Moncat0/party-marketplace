'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  email: string
  firstName: string
  lastName: string
  phone: string
  authProvider: string | null
  notifMarketing: boolean
}

function Msg({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null
  return (
    <p className={`text-xs mt-2 ${msg.type === 'success' ? 'text-[#1D9E75]' : 'text-red-600'}`}>
      {msg.text}
    </p>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1A1A2E]">{label}</p>
        <p className="text-xs text-[#717171] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[#FF6B35]' : 'bg-[#EBEBEB]'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-[#EBEBEB] bg-[#F7F7F7] px-4 py-2.5 text-sm text-[#1A1A2E] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] transition-colors'

export default function PlannerAccountSettings({
  email, firstName, lastName, phone, authProvider, notifMarketing,
}: Props) {
  const supabase = createClient()
  const isSocial = authProvider === 'google' || authProvider === 'facebook' || authProvider === 'apple'
  const socialName = authProvider === 'google' ? 'Google' : authProvider === 'facebook' ? 'Facebook' : 'Apple'

  const [newFirst, setNewFirst] = useState(firstName)
  const [newLast, setNewLast] = useState(lastName)
  const [newPhone, setNewPhone] = useState(phone)
  const [newEmail, setNewEmail] = useState(email)
  const [newPassword, setNewPassword] = useState('')
  const [marketing, setMarketing] = useState(notifMarketing)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [notifsMsg, setNotifsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSaveProfile() {
    if (!newFirst.trim()) return
    setSavingProfile(true); setProfileMsg(null)
    const fullName = [newFirst.trim(), newLast.trim()].filter(Boolean).join(' ')
    const { error } = await supabase.from('users').update({
      first_name: newFirst.trim(),
      last_name: newLast.trim() || null,
      name: fullName,
      phone: newPhone.trim() || null,
    }).eq('email', email)
    setProfileMsg(error ? { type: 'error', text: 'Något gick fel. Försök igen.' } : { type: 'success', text: 'Profil uppdaterad!' })
    setSavingProfile(false)
  }

  async function handleSaveEmail() {
    if (!newEmail.trim() || newEmail === email) return
    setSavingEmail(true); setEmailMsg(null)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailMsg(error
      ? { type: 'error', text: 'Kunde inte uppdatera e-post. Försök igen.' }
      : { type: 'success', text: 'En bekräftelse har skickats till den nya adressen.' })
    setSavingEmail(false)
  }

  async function handleSavePassword() {
    if (newPassword.length < 8) { setPasswordMsg({ type: 'error', text: 'Lösenordet måste vara minst 8 tecken.' }); return }
    setSavingPassword(true); setPasswordMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: 'Kunde inte uppdatera lösenordet. Försök igen.' })
    } else {
      setPasswordMsg({ type: 'success', text: 'Lösenord uppdaterat!' })
      setNewPassword('')
    }
    setSavingPassword(false)
  }

  async function handleSaveNotifs() {
    setSavingNotifs(true); setNotifsMsg(null)
    const { error } = await supabase.from('users').update({ notif_marketing: marketing }).eq('email', email)
    setNotifsMsg(error ? { type: 'error', text: 'Något gick fel. Försök igen.' } : { type: 'success', text: 'Inställningar sparade!' })
    setSavingNotifs(false)
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    await supabase.auth.signOut()
    window.location.href = '/?deleted=1'
  }

  return (
    <div className="max-w-2xl space-y-4">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Inställningar</h1>
        <p className="text-sm text-[#717171] mt-1">Hantera ditt konto och dina notifieringar</p>
      </div>

      {/* PROFIL */}
      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-6">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">Profil</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#717171] mb-1.5">Förnamn</label>
              <input type="text" value={newFirst} onChange={e => setNewFirst(e.target.value)} placeholder="Anna" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#717171] mb-1.5">Efternamn</label>
              <input type="text" value={newLast} onChange={e => setNewLast(e.target.value)} placeholder="Lindqvist" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#717171] mb-1.5">
              Telefon <span className="text-[#A0A0A0] font-normal">(valfritt)</span>
            </label>
            <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+46 70 123 45 67" className={inputClass} />
            <p className="text-xs text-[#A0A0A0] mt-1.5">Syns bara för talanger du har en aktiv bokning med.</p>
          </div>
        </div>
        <Msg msg={profileMsg} />
        <button onClick={handleSaveProfile} disabled={savingProfile || !newFirst.trim()}
          className="mt-4 rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40">
          {savingProfile ? 'Sparar...' : 'Spara profil'}
        </button>
      </div>

      {/* E-POST */}
      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-6">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">E-postadress</h2>
        {isSocial ? (
          <p className="text-sm text-[#717171]">Du är inloggad med {socialName}. E-postadressen hanteras av dem.</p>
        ) : (
          <>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputClass} />
            <Msg msg={emailMsg} />
            <button onClick={handleSaveEmail} disabled={savingEmail || newEmail === email || !newEmail.trim()}
              className="mt-3 rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40">
              {savingEmail ? 'Sparar...' : 'Uppdatera e-post'}
            </button>
          </>
        )}
      </div>

      {/* LÖSENORD */}
      {!isSocial && (
        <div className="rounded-2xl bg-white border border-[#EBEBEB] p-6">
          <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">Lösenord</h2>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="Nytt lösenord (minst 8 tecken)" className={inputClass} />
          <Msg msg={passwordMsg} />
          <div className="mt-3 flex items-center gap-4">
            <button onClick={handleSavePassword} disabled={savingPassword || newPassword.length < 8}
              className="rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40">
              {savingPassword ? 'Sparar...' : 'Uppdatera lösenord'}
            </button>
            {!resetSent ? (
              <button onClick={async () => {
                setResetSent(true)
                await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
              }} className="text-xs text-[#717171] hover:text-[#FF6B35] transition-colors">
                Glömt lösenordet? Skicka återställningslänk →
              </button>
            ) : (
              <p className="text-xs text-[#1D9E75]">Återställningslänk skickad!</p>
            )}
          </div>
        </div>
      )}

      {/* MEJLINSTÄLLNINGAR */}
      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-6">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">Mejlinställningar</h2>
        <div className="mb-5 rounded-xl bg-[#F7F7F7] border border-[#EBEBEB] px-4 py-4">
          <p className="text-xs font-semibold text-[#1A1A2E] mb-2">Alltid aktivt — kan inte stängas av</p>
          <ul className="space-y-1 text-xs text-[#717171]">
            <li>✓ Bekräftelse när en talang accepterar din bokning</li>
            <li>✓ Meddelande om avböjd förfrågan</li>
            <li>✓ Ny konversation eller meddelande</li>
            <li>✓ Påminnelse att lämna omdöme efter eventet</li>
          </ul>
          <p className="text-xs text-[#A0A0A0] mt-2">Dessa mejl är nödvändiga för att tjänsten ska fungera.</p>
        </div>
        <Toggle
          label="Marknadsföringsmejl"
          description="Tips, inspiration och nyheter från FESTEN."
          checked={marketing}
          onChange={setMarketing}
        />
        <Msg msg={notifsMsg} />
        <button onClick={handleSaveNotifs} disabled={savingNotifs}
          className="mt-4 rounded-xl bg-[#1A1A2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d2d4e] transition-colors disabled:opacity-40">
          {savingNotifs ? 'Sparar...' : 'Spara inställningar'}
        </button>
      </div>

      {/* RADERA KONTO */}
      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-6">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-1">Radera konto</h2>
        <p className="text-xs text-[#717171] mb-4">All din data raderas permanent. Detta går inte att ångra.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            Radera mitt konto
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={handleDeleteAccount} disabled={deletingAccount}
              className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-40">
              {deletingAccount ? 'Raderar...' : 'Ja, radera mitt konto'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-[#717171] hover:text-[#1A1A2E]">
              Avbryt
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
