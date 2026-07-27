'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import SettingsSectionHeading from './SettingsSectionHeading'
import { settingsTokens as t } from './tokens'

export type DeviceSession = {
  id: string
  title: string
  browser: string
  os: string
  ip: string | null
  lastActive: string
  lastActiveLabel: string
  isCurrent: boolean
}

function DeviceIcon({ os }: { os: string }) {
  const mobile = os === 'iPhone' || os === 'iPad' || os === 'Android'
  return (
    <div
      className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center"
      style={{ color: t.colors.ink }}
      aria-hidden
    >
      {mobile ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M8 20h8M12 18v2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

/** Airbnb-style device history list backed by auth.sessions. */
export default function DeviceHistorySection() {
  const [devices, setDevices] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/account/sessions')
      const json = (await res.json()) as { devices?: DeviceSession[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte hämta enheter')
      setDevices(json.devices ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte hämta enheter')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function revokeOne(id: string) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, scope: 'one' }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte logga ut enheten')
      setDevices(prev => prev.filter(d => d.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte logga ut enheten')
    } finally {
      setBusyId(null)
    }
  }

  async function revokeOthers() {
    setBusyId('others')
    setError(null)
    try {
      const res = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'others' }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte logga ut andra enheter')
      setDevices(prev => prev.filter(d => d.isCurrent))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte logga ut andra enheter')
    } finally {
      setBusyId(null)
    }
  }

  const othersCount = devices.filter(d => !d.isCurrent).length

  return (
    <div>
      <SettingsSectionHeading
        title="Enhetshistorik"
        action={
          othersCount > 0 ? (
            <Button
              type="button"
              variant="link"
              onClick={() => void revokeOthers()}
              disabled={busyId === 'others'}
              className="h-auto p-0 text-[14px] font-medium text-foreground underline underline-offset-[3px]"
            >
              {busyId === 'others' ? 'Loggar ut…' : 'Logga ut från alla andra'}
            </Button>
          ) : undefined
        }
      />

      {loading && (
        <p className="py-7 text-[14px] font-normal text-[#6a6a6a]">Hämtar enheter…</p>
      )}
      {error && (
        <p className="py-3 text-[13px] font-normal" style={{ color: t.colors.error }}>
          {error}
        </p>
      )}

      {!loading && devices.length === 0 && (
        <p className="py-7 text-[14px] font-normal text-[#6a6a6a]">Inga aktiva sessioner hittades.</p>
      )}

      <div>
        {devices.map((device, i) => {
          const isLast = i === devices.length - 1
          const label = `${device.os} · ${device.browser}`
          return (
            <div
              key={device.id}
              className="flex items-start justify-between gap-6"
              style={{
                borderBottom: isLast ? 'none' : `1px solid ${t.colors.hairlineSoft}`,
                paddingTop: 24,
                paddingBottom: 24,
              }}
            >
              <div className="flex min-w-0 gap-4">
                <DeviceIcon os={device.os} />
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-[#222222]">{label}</p>
                  {device.isCurrent && (
                    <span
                      className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6a6a6a]"
                      style={{ backgroundColor: t.colors.surfaceSoft }}
                    >
                      Aktuell session
                    </span>
                  )}
                  <p className="mt-1.5 text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
                    {device.lastActiveLabel}
                    {device.ip ? ` · ${device.ip}` : ''}
                  </p>
                </div>
              </div>
              {!device.isCurrent && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => void revokeOne(device.id)}
                  disabled={busyId === device.id}
                  className="h-auto flex-shrink-0 p-0 text-[14px] font-medium text-foreground underline underline-offset-[3px]"
                >
                  {busyId === device.id ? '…' : 'Logga ut'}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
