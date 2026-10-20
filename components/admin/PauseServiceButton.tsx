'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PauseCircle, PlayCircle } from 'lucide-react'

export default function PauseServiceButton({
  serviceId,
  isDisabled,
}: {
  serviceId: string
  isDisabled: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_disabled: !isDisabled }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(json.error ?? `Fel ${res.status}`)
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      alert('Nätverksfel – kunde inte nå servern.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      title={isDisabled ? 'Återaktivera tjänsten' : 'Pausa tjänsten (döljs från sök)'}
      className="text-muted-foreground/50 transition-colors hover:text-foreground disabled:opacity-40"
    >
      {isDisabled ? (
        <PlayCircle className="size-3.5" strokeWidth={2} />
      ) : (
        <PauseCircle className="size-3.5" strokeWidth={2} />
      )}
    </button>
  )
}
