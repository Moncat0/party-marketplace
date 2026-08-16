'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { settingsTokens as t } from './tokens'

export type NotificationPrefs = {
  bookingAccepted: boolean
  bookingDeclined: boolean
  newMessage: boolean
  reviewReminder: boolean
  marketing: boolean
  providerNews: boolean
  providerRegs: boolean
  festenNews: boolean
  festenFeedback: boolean
}

type Props = {
  email: string
  initial: NotificationPrefs
  role: 'planner' | 'provider'
  /** Show talent/provider marketing prefs for dual-role planners. */
  hasProviderProfile?: boolean
}

type Tab = 'offers' | 'account'

type PrefKey = keyof NotificationPrefs

const DB_FIELD: Record<PrefKey, string> = {
  bookingAccepted: 'notif_booking_accepted',
  bookingDeclined: 'notif_booking_declined',
  newMessage: 'notif_new_message',
  reviewReminder: 'notif_review_reminder',
  marketing: 'notif_marketing',
  providerNews: 'notif_provider_news',
  providerRegs: 'notif_provider_regs',
  festenNews: 'notif_festen_news',
  festenFeedback: 'notif_festen_feedback',
}

const MARKETING_KEYS: PrefKey[] = [
  'providerNews',
  'providerRegs',
  'festenNews',
  'festenFeedback',
]

function statusLabel(on: boolean) {
  return on ? 'På: E-post' : 'Av'
}

/** Single notification row — Airbnb Edit expands to Email checkbox (no SMS). */
function NotifRow({
  label,
  enabled,
  editing,
  onEdit,
  onCancel,
  onToggleEmail,
  saving,
}: {
  label: string
  enabled: boolean
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onToggleEmail: (value: boolean) => void
  saving: boolean
}) {
  return (
    <div className="py-5">
      <p className="text-[16px] font-normal leading-[1.25] text-[#222222]">{label}</p>
      {!editing ? (
        <>
          <p className="mt-1 text-[14px] text-[#6a6a6a]">{statusLabel(enabled)}</p>
          <Button
            type="button"
            variant="link"
            onClick={onEdit}
            className="mt-1 h-auto p-0 text-[14px] font-medium text-[#222222] underline underline-offset-[3px]"
          >
            Redigera
          </Button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              disabled={saving}
              onChange={e => onToggleEmail(e.target.checked)}
              className="h-5 w-5 rounded border-[#b0b0b0] accent-[#222222]"
            />
            <span className="text-[16px] text-[#222222]">E-post</span>
          </label>
          <Button
            type="button"
            variant="link"
            onClick={onCancel}
            className="h-auto p-0 text-[14px] font-medium text-[#222222] underline underline-offset-[3px]"
          >
            Klar
          </Button>
        </div>
      )}
    </div>
  )
}

function SectionBlock({
  title,
  description,
  children,
  isLast = false,
}: {
  title: string
  description: string
  children: ReactNode
  isLast?: boolean
}) {
  return (
    <section
      style={
        isLast
          ? { paddingTop: 40, paddingBottom: 8 }
          : {
              borderBottom: `1px solid ${t.colors.hairlineSoft}`,
              paddingTop: 40,
              paddingBottom: 32,
            }
      }
    >
      <h3 className="text-[18px] font-semibold leading-[1.25] text-[#222222]">{title}</h3>
      <p className="mt-1 text-[14px] leading-[1.43] text-[#6a6a6a]">{description}</p>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export default function NotificationsSettings({
  email,
  initial,
  role,
  hasProviderProfile = false,
}: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('offers')
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const unsubscribeAll = MARKETING_KEYS.every(k => !prefs[k]) && !prefs.marketing

  async function saveFields(patch: Partial<NotificationPrefs>) {
    setSaving(true)
    setMsg(null)
    const dbPatch: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(patch) as [PrefKey, boolean][]) {
      dbPatch[DB_FIELD[key]] = value
    }
    const { error } = await supabase.from('users').update(dbPatch).eq('email', email)
    if (error) {
      setMsg({ type: 'error', text: 'Kunde inte spara. Försök igen.' })
      setSaving(false)
      return false
    }
    setPrefs(prev => ({ ...prev, ...patch }))
    setSaving(false)
    return true
  }

  async function setPref(key: PrefKey, value: boolean) {
    const prev = prefs[key]
    setPrefs(p => ({ ...p, [key]: value }))

    const patch: Partial<NotificationPrefs> = { [key]: value }

    // Keep master marketing flag in sync with sub-prefs
    if (MARKETING_KEYS.includes(key)) {
      if (value) {
        patch.marketing = true
      } else {
        const next = { ...prefs, [key]: false }
        const anyOn = MARKETING_KEYS.some(k => (k === key ? false : next[k]))
        if (!anyOn) patch.marketing = false
      }
    }

    const ok = await saveFields(patch)
    if (!ok) setPrefs(p => ({ ...p, [key]: prev }))
  }

  async function handleUnsubscribeAll(checked: boolean) {
    if (checked) {
      const patch: Partial<NotificationPrefs> = {
        marketing: false,
        providerNews: false,
        providerRegs: false,
        festenNews: false,
        festenFeedback: false,
      }
      const prev = { ...prefs }
      setPrefs(p => ({ ...p, ...patch }))
      const ok = await saveFields(patch)
      if (!ok) setPrefs(prev)
      setEditing(null)
    } else {
      // Re-enable master + festen news as a sensible default
      const patch: Partial<NotificationPrefs> = {
        marketing: true,
        festenNews: true,
      }
      const prev = { ...prefs }
      setPrefs(p => ({ ...p, ...patch }))
      const ok = await saveFields(patch)
      if (!ok) setPrefs(prev)
    }
  }

  return (
    <>
      <h2 className="mb-6 text-[26px] font-bold leading-[1.125] tracking-[-0.02em] text-[#222222] md:text-[32px]">
        Notifieringar
      </h2>
      {msg && (
        <p
          className="mb-4 text-[13px]"
          style={{ color: msg.type === 'success' ? t.colors.success : t.colors.error }}
        >
          {msg.text}
        </p>
      )}

      {/* Tabs — Airbnb: active = thick black underline; hairline under tab bar */}
      <div
        className="flex gap-8"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        {(
          [
            { id: 'offers' as const, label: 'Erbjudanden och uppdateringar' },
            { id: 'account' as const, label: 'Konto' },
          ] as const
        ).map(item => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id)
                setEditing(null)
              }}
              className="relative pb-4 text-[16px] transition-colors"
              style={{
                fontWeight: active ? 600 : 400,
                color: active ? '#222222' : '#6a6a6a',
              }}
            >
              {item.label}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222]"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      {tab === 'offers' && (
        <div>
          {hasProviderProfile && (
            <SectionBlock
              title="Provideruppdateringar"
              description="Få uppdateringar om program, funktioner och regler."
            >
              <NotifRow
                label="Nyheter och uppdateringar"
                enabled={prefs.providerNews}
                editing={editing === 'providerNews'}
                onEdit={() => setEditing('providerNews')}
                onCancel={() => setEditing(null)}
                onToggleEmail={v => setPref('providerNews', v)}
                saving={saving}
              />
              <NotifRow
                label="Lokala regler och föreskrifter"
                enabled={prefs.providerRegs}
                editing={editing === 'providerRegs'}
                onEdit={() => setEditing('providerRegs')}
                onCancel={() => setEditing(null)}
                onToggleEmail={v => setPref('providerRegs', v)}
                saving={saving}
              />
            </SectionBlock>
          )}

          <SectionBlock
            title="Festly-uppdateringar"
            description="Håll dig uppdaterad om nyheter från Festly och hjälp oss bli bättre."
            isLast
          >
            <NotifRow
              label="Nyheter och program"
              enabled={prefs.festenNews}
              editing={editing === 'festenNews'}
              onEdit={() => setEditing('festenNews')}
              onCancel={() => setEditing(null)}
              onToggleEmail={v => setPref('festenNews', v)}
              saving={saving}
            />
            <NotifRow
              label="Feedback"
              enabled={prefs.festenFeedback}
              editing={editing === 'festenFeedback'}
              onEdit={() => setEditing('festenFeedback')}
              onCancel={() => setEditing(null)}
              onToggleEmail={v => setPref('festenFeedback', v)}
              saving={saving}
            />
          </SectionBlock>

          <div
            style={{
              borderTop: `1px solid ${t.colors.hairlineSoft}`,
              paddingTop: 28,
              marginTop: 8,
            }}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={unsubscribeAll}
                disabled={saving}
                onChange={e => handleUnsubscribeAll(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-[#b0b0b0] accent-[#222222]"
              />
              <span className="text-[16px] text-[#222222]">
                Avsluta prenumeration på alla marknadsföringsmejl
              </span>
            </label>
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div>
          <SectionBlock
            title="Kontoaktivitet och policyer"
            description="Bekräfta bokningar och kontoaktivitet, och lär dig om viktiga Festly-policyer."
          >
            <NotifRow
              label={role === 'provider' ? 'Bokningsförfrågningar' : 'Bokningsbekräftelser'}
              enabled={prefs.bookingAccepted}
              editing={editing === 'bookingAccepted'}
              onEdit={() => setEditing('bookingAccepted')}
              onCancel={() => setEditing(null)}
              onToggleEmail={v => setPref('bookingAccepted', v)}
              saving={saving}
            />
            <NotifRow
              label="Bokningsuppdateringar"
              enabled={prefs.bookingDeclined}
              editing={editing === 'bookingDeclined'}
              onEdit={() => setEditing('bookingDeclined')}
              onCancel={() => setEditing(null)}
              onToggleEmail={v => setPref('bookingDeclined', v)}
              saving={saving}
            />
            <div className="py-5">
              <p className="text-[16px] font-normal leading-[1.25] text-[#222222]">
                Policyer och konto
              </p>
              <p className="mt-1 text-[14px] text-[#6a6a6a]">På: E-post</p>
              <p className="mt-1 text-[13px] text-[#929292]">
                Nödvändiga mejl om ditt konto kan inte stängas av.
              </p>
            </div>
          </SectionBlock>

          <SectionBlock
            title="Påminnelser"
            description="Få viktiga påminnelser om bokningar och kontoaktivitet."
          >
            <NotifRow
              label="Påminnelser"
              enabled={prefs.reviewReminder}
              editing={editing === 'reviewReminder'}
              onEdit={() => setEditing('reviewReminder')}
              onCancel={() => setEditing(null)}
              onToggleEmail={v => setPref('reviewReminder', v)}
              saving={saving}
            />
          </SectionBlock>

          <SectionBlock
            title="Meddelanden"
            description="Håll kontakten före, under och efter en bokning."
            isLast
          >
            <NotifRow
              label="Meddelanden"
              enabled={prefs.newMessage}
              editing={editing === 'newMessage'}
              onEdit={() => setEditing('newMessage')}
              onCancel={() => setEditing(null)}
              onToggleEmail={v => setPref('newMessage', v)}
              saving={saving}
            />
          </SectionBlock>
        </div>
      )}
    </>
  )
}
