'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminReviewActions({
  reviewId,
  isHidden,
}: {
  reviewId: string
  isHidden: boolean
}) {
  const router = useRouter()
  const [hidden, setHidden] = useState(isHidden)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggleHide() {
    setLoading(true)
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_hidden: !hidden }),
    })
    if (res.ok) {
      setHidden(h => !h)
      router.refresh()
    }
    setLoading(false)
  }

  async function deleteReview() {
    setLoading(true)
    const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    setLoading(false)
    setConfirmDelete(false)
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setConfirmDelete(false)}
          disabled={loading}
          className="text-[12px] text-muted-foreground hover:underline"
        >
          Avbryt
        </button>
        <button
          onClick={deleteReview}
          disabled={loading}
          className="text-[12px] font-semibold text-destructive hover:underline"
        >
          {loading ? 'Raderar…' : 'Bekräfta'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleHide}
        disabled={loading}
        className="text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {loading ? '…' : hidden ? 'Visa' : 'Dölj'}
      </button>
      <button
        onClick={() => setConfirmDelete(true)}
        disabled={loading}
        className="text-[12px] font-medium text-destructive/60 hover:text-destructive disabled:opacity-50"
      >
        Radera
      </button>
    </div>
  )
}
