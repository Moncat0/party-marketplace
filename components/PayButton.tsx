'use client'

import { useState } from 'react'

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
      <button
        onClick={handlePay}
        disabled={loading}
        className="rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-semibold text-white hover:bg-[#178a65] transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? '...' : `Betala ${priceSek} kr →`}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 max-w-[200px]">{error}</p>}
    </div>
  )
}
