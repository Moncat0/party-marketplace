'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Väntande' },
  { value: 'accepted', label: 'Accepterad' },
  { value: 'declined', label: 'Nekad' },
  { value: 'completed', label: 'Genomförd' },
  { value: 'cancelled', label: 'Avbokad' },
]

export default function AdminBookingActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function update(newStatus: string) {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(json.error ?? `Fel ${res.status}`)
      } else {
        setStatus(newStatus)
        setMsg('Uppdaterad.')
        router.refresh()
      }
    } catch {
      setMsg('Nätverksfel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[13px] font-medium text-muted-foreground">Ändra status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.filter(o => o.value !== status).map(o => (
            <button
              key={o.value}
              onClick={() => update(o.value)}
              disabled={loading}
              className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {loading ? '…' : `→ ${o.label}`}
            </button>
          ))}
        </div>
      </div>
      {msg ? <p className="text-[13px] text-muted-foreground">{msg}</p> : null}
      <div>
        <p className="text-[12px] text-muted-foreground">
          Aktuell status: <span className="font-semibold">{STATUS_OPTIONS.find(o => o.value === status)?.label ?? status}</span>
        </p>
      </div>
    </div>
  )
}
