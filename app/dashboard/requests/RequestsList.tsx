'use client'

import { useState } from 'react'
import Link from 'next/link'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'
import { formatEventType } from '@/lib/event-types'

type Request = {
  id: string
  status: string
  event_date: string | null
  event_type: string | null
  event_location: string | null
  guest_count: number | null
  description: string | null
  created_at: string
  users: { id: string; name: string | null; email: string } | null
}

function statusStyle(status: string): { bg: string; color: string; label: string } {
  if (status === 'accepted')
    return { bg: 'rgba(29, 158, 117, 0.1)', color: t.colors.success, label: 'Accepterad' }
  if (status === 'declined')
    return { bg: t.colors.surfaceStrong, color: t.colors.muted, label: 'Avböjd' }
  return { bg: 'rgba(255, 107, 53, 0.1)', color: t.colors.primary, label: 'Väntar' }
}

export default function RequestsList({ requests }: { requests: Request[] }) {
  const [list, setList] = useState(requests)
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function updateStatus(id: string, status: 'accepted' | 'declined') {
    setLoading(id)
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setList(prev => prev.map(r => (r.id === id ? { ...r, status } : r)))
    }
    setLoading(null)
  }

  const pending = list.filter(r => r.status === 'pending')
  const others = list.filter(r => r.status !== 'pending')

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-[#222222]">
          Förfrågningar
        </h1>
        <p className="text-[14px] text-[#6a6a6a] mt-1">
          {pending.length > 0
            ? `${pending.length} väntar på svar`
            : 'Inga väntande förfrågningar'}
          {others.length > 0 && ` · ${others.length} hanterade`}
        </p>
      </div>

      {list.length === 0 ? (
        <SettingsSection title="Inga förfrågningar ännu">
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a]">
            När planerare skickar förfrågningar dyker de upp här.
          </p>
        </SettingsSection>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div
              className="bg-white overflow-hidden divide-y"
              style={{
                borderRadius: t.rounded.md,
                border: `1px solid ${t.colors.hairline}`,
              }}
            >
              {pending.map(req => (
                <RequestRow
                  key={req.id}
                  req={req}
                  loading={loading}
                  expanded={expanded}
                  onExpand={id => setExpanded(expanded === id ? null : id)}
                  onUpdate={updateStatus}
                />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <>
              {pending.length > 0 && (
                <p className="text-[12px] font-semibold text-[#6a6a6a] uppercase tracking-wide px-1">
                  Hanterade
                </p>
              )}
              <div
                className="bg-white overflow-hidden divide-y"
                style={{
                  borderRadius: t.rounded.md,
                  border: `1px solid ${t.colors.hairline}`,
                }}
              >
                {others.map(req => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    loading={loading}
                    expanded={expanded}
                    onExpand={id => setExpanded(expanded === id ? null : id)}
                    onUpdate={updateStatus}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function RequestRow({
  req,
  loading,
  expanded,
  onExpand,
  onUpdate,
}: {
  req: Request
  loading: string | null
  expanded: string | null
  onExpand: (id: string) => void
  onUpdate: (id: string, status: 'accepted' | 'declined') => void
}) {
  const isExpanded = expanded === req.id
  const plannerName = req.users?.name ?? 'Okänd'
  const badge = statusStyle(req.status)

  return (
    <div style={{ borderColor: t.colors.hairlineSoft }}>
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
        style={{ transitionDuration: t.motion.fast }}
        onClick={() => onExpand(req.id)}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = t.colors.surfaceSoft
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <div
          className="h-9 w-9 flex items-center justify-center flex-shrink-0"
          style={{
            borderRadius: t.rounded.full,
            backgroundColor: 'rgba(34, 34, 34, 0.08)',
          }}
        >
          <span className="text-xs font-bold text-[#222222]">
            {plannerName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-[14px] font-semibold text-[#222222] truncate">{plannerName}</p>
            <span
              className="flex-shrink-0 px-2.5 py-0.5 text-[12px] font-medium"
              style={{
                borderRadius: t.rounded.full,
                backgroundColor: badge.bg,
                color: badge.color,
              }}
            >
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {req.event_date && (
              <p className="text-[12px] text-[#6a6a6a]">
                {new Date(req.event_date).toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
            {req.event_type && (
              <p className="text-[12px] text-[#6a6a6a]">
                {formatEventType(req.event_type) ?? req.event_type}
              </p>
            )}
            {req.guest_count && (
              <p className="text-[12px] text-[#6a6a6a]">{req.guest_count} gäster</p>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {req.status === 'pending' && (
            <>
              <SettingsButton
                size="sm"
                variant="secondary"
                onClick={() => onUpdate(req.id, 'declined')}
                disabled={loading === req.id}
              >
                Avböj
              </SettingsButton>
              <SettingsButton
                size="sm"
                onClick={() => onUpdate(req.id, 'accepted')}
                disabled={loading === req.id}
              >
                {loading === req.id ? '...' : 'Acceptera'}
              </SettingsButton>
            </>
          )}
          {req.status === 'accepted' && (
            <Link href={`/dashboard/messages?c=${req.id}`}>
              <SettingsButton size="sm" variant="dark">
                Chatt & offert →
              </SettingsButton>
            </Link>
          )}
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 text-[#929292] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ transitionDuration: t.motion.fast }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isExpanded && (
        <div
          className="px-5 pb-5"
          style={{
            backgroundColor: t.colors.surfaceSoft,
            borderTop: `1px solid ${t.colors.hairlineSoft}`,
          }}
        >
          <div className="pt-4 grid grid-cols-2 gap-x-8 gap-y-3">
            {req.event_location && (
              <div>
                <p className="text-[12px] font-medium text-[#6a6a6a] mb-0.5">Plats</p>
                <p className="text-[14px] text-[#222222]">{req.event_location}</p>
              </div>
            )}
            {req.guest_count && (
              <div>
                <p className="text-[12px] font-medium text-[#6a6a6a] mb-0.5">Antal gäster</p>
                <p className="text-[14px] text-[#222222]">{req.guest_count}</p>
              </div>
            )}
            <div>
              <p className="text-[12px] font-medium text-[#6a6a6a] mb-0.5">Skickad</p>
              <p className="text-[14px] text-[#222222]">
                {new Date(req.created_at).toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {req.users?.email && (
              <div>
                <p className="text-[12px] font-medium text-[#6a6a6a] mb-0.5">E-post</p>
                <p className="text-[14px] text-[#222222]">{req.users.email}</p>
              </div>
            )}
          </div>
          {req.description && (
            <div className="mt-4">
              <p className="text-[12px] font-medium text-[#6a6a6a] mb-1">Meddelande</p>
              <p
                className="text-[14px] text-[#222222] leading-relaxed px-4 py-3"
                style={{
                  backgroundColor: t.colors.canvas,
                  borderRadius: t.rounded.sm,
                  border: `1px solid ${t.colors.hairline}`,
                }}
              >
                {req.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
