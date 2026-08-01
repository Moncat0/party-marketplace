'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function PayButton({ bookingId, priceOre }: { bookingId: string; priceOre: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Något gick fel. Försök igen.')
        setLoading(false)
      }
    } catch {
      setError('Något gick fel. Försök igen.')
      setLoading(false)
    }
  }

  const priceSek = Math.round(priceOre / 100).toLocaleString('sv-SE')

  return (
    <div>
      <Button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="h-12 w-full rounded-xl bg-success text-[15px] font-semibold text-white hover:bg-success/90 sm:w-auto sm:min-w-[160px]"
      >
        {loading ? '...' : `Betala ${priceSek} kr →`}
      </Button>
      {error && <p className="text-xs text-destructive mt-1 max-w-[200px]">{error}</p>}
    </div>
  )
}
