'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteServiceButton({
  serviceId,
  serviceTitle,
}: {
  serviceId: string
  serviceTitle: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(json.error ?? `Fel ${res.status}: kunde inte radera tjänsten.`)
        setLoading(false)
        setConfirming(false)
        return
      }
      router.refresh()
    } catch (err) {
      alert('Nätverksfel – kunde inte nå servern.')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-[12px] text-muted-foreground hover:underline"
        >
          Avbryt
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-[12px] font-semibold text-destructive hover:underline"
        >
          {loading ? 'Raderar…' : 'Bekräfta'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Radera "${serviceTitle}"`}
      className="text-muted-foreground/50 transition-colors hover:text-destructive"
    >
      <Trash2 className="size-3.5" strokeWidth={2} />
    </button>
  )
}
