'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminReportActions({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(status: string) {
    setLoading(true)
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => update('resolved')}
        disabled={loading}
        className="text-[12px] font-medium text-foreground hover:underline disabled:opacity-50"
      >
        Markera hanterad
      </button>
      <button
        onClick={() => update('dismissed')}
        disabled={loading}
        className="text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        Avvisa
      </button>
    </div>
  )
}
