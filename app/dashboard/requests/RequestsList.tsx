'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'Födelsedag',
  wedding: 'Bröllop',
  corporate: 'Företagsevent',
  kids: 'Barnkalas',
  other: 'Annat',
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
      setList(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
    setLoading(null)
  }

  const pending = list.filter(r => r.status === 'pending')
  const others = list.filter(r => r.status !== 'pending')

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Förfrågningar</h1>
          <p className="text-sm text-[#717171] mt-1">
            {pending.length > 0 ? `${pending.length} väntar på svar` : 'Inga väntande förfrågningar'}
            {others.length > 0 && ` · ${others.length} hanterade`}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBEBEB] py-20 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-base font-semibold text-[#1A1A2E] mb-2">Inga förfrågningar ännu</p>
          <p className="text-sm text-[#717171]">När planerare skickar förfrågningar dyker de upp här.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending first */}
          {pending.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB] overflow-hidden">
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

          {/* Handled */}
          {others.length > 0 && (
            <>
              {pending.length > 0 && (
                <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide px-1 pt-2">Hanterade</p>
              )}
              <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB] overflow-hidden">
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

function RequestRow({ req, loading, expanded, onExpand, onUpdate }: {
  req: Request
  loading: string | null
  expanded: string | null
  onExpand: (id: string) => void
  onUpdate: (id: string, status: 'accepted' | 'declined') => void
}) {
  const isExpanded = expanded === req.id
  const plannerName = req.users?.name ?? 'Okänd'

  return (
    <div>
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#F7F7F7] transition-colors"
        onClick={() => onExpand(req.id)}
      >
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-[#1A1A2E]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[#1A1A2E]">{plannerName.charAt(0).toUpperCase()}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-[#1A1A2E] truncate">{plannerName}</p>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              req.status === 'accepted' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' :
              req.status === 'declined' ? 'bg-[#F7F7F7] text-[#717171]' :
              'bg-[#FF6B35]/10 text-[#FF6B35]'
            }`}>
              {req.status === 'accepted' ? 'Accepterad' : req.status === 'declined' ? 'Avböjd' : 'Väntar'}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {req.event_date && (
              <p className="text-xs text-[#717171]">
                {new Date(req.event_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            {req.event_type && <p className="text-xs text-[#717171]">{EVENT_TYPE_LABELS[req.event_type] ?? req.event_type}</p>}
            {req.guest_count && <p className="text-xs text-[#717171]">{req.guest_count} gäster</p>}
          </div>
        </div>

        {/* Right: actions or chevron */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {req.status === 'pending' && (
            <>
              <button onClick={() => onUpdate(req.id, 'declined')} disabled={loading === req.id}
                className="rounded-xl border border-[#EBEBEB] px-4 py-2 text-xs font-medium text-[#717171] hover:bg-[#F7F7F7] transition-colors disabled:opacity-40">
                Avböj
              </button>
              <button onClick={() => onUpdate(req.id, 'accepted')} disabled={loading === req.id}
                className="rounded-xl bg-[#FF6B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40">
                {loading === req.id ? '...' : 'Acceptera'}
              </button>
            </>
          )}
          {req.status === 'accepted' && (
            <Link href={`/booking/${req.id}/messages`}
              className="rounded-xl bg-[#1A1A2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d2d4e] transition-colors">
              Chatt & offert →
            </Link>
          )}
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 text-[#A0A0A0] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-6 pb-5 bg-[#FAFAFA] border-t border-[#EBEBEB]">
          <div className="pt-4 grid grid-cols-2 gap-x-8 gap-y-3">
            {req.event_location && (
              <div>
                <p className="text-xs font-medium text-[#717171] mb-0.5">Plats</p>
                <p className="text-sm text-[#1A1A2E]">{req.event_location}</p>
              </div>
            )}
            {req.guest_count && (
              <div>
                <p className="text-xs font-medium text-[#717171] mb-0.5">Antal gäster</p>
                <p className="text-sm text-[#1A1A2E]">{req.guest_count}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-[#717171] mb-0.5">Skickad</p>
              <p className="text-sm text-[#1A1A2E]">
                {new Date(req.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {req.users?.email && (
              <div>
                <p className="text-xs font-medium text-[#717171] mb-0.5">E-post</p>
                <p className="text-sm text-[#1A1A2E]">{req.users.email}</p>
              </div>
            )}
          </div>
          {req.description && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[#717171] mb-1">Meddelande</p>
              <p className="text-sm text-[#1A1A2E] leading-relaxed bg-white rounded-xl border border-[#EBEBEB] px-4 py-3">{req.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
