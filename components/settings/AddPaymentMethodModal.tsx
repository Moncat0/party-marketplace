'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { settingsTokens as t } from './tokens'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
)

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultFirstName?: string
  defaultLastName?: string
}

const fieldStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#222222',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: '#929292' },
    },
    invalid: { color: '#c13515' },
  },
}

function AddCardForm({
  onClose,
  onSaved,
  defaultFirstName = '',
  defaultLastName = '',
}: Omit<Props, 'open'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [firstName, setFirstName] = useState(defaultFirstName)
  const [lastName, setLastName] = useState(defaultLastName)
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('SE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSaving(true)
    setError(null)

    const cardNumber = elements.getElement(CardNumberElement)
    if (!cardNumber) {
      setSaving(false)
      return
    }

    const res = await fetch('/api/payments/methods', { method: 'POST' })
    const json = (await res.json()) as { clientSecret?: string; error?: string }
    if (!res.ok || !json.clientSecret) {
      setError(json.error ?? 'Något gick fel')
      setSaving(false)
      return
    }

    const result = await stripe.confirmCardSetup(json.clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: {
          name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
          address: {
            postal_code: postalCode || undefined,
            country: country || undefined,
          },
        },
      },
    })

    if (result.error) {
      setError(result.error.message ?? 'Kunde inte spara kortet')
      setSaving(false)
      return
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  const inputClass =
    'w-full px-4 py-3.5 text-[16px] text-[#222222] placeholder:text-[#929292] outline-none bg-transparent'

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 flex items-center gap-2">
        <span className="text-[11px] font-bold tracking-wide text-[#1A1F71]">VISA</span>
        <span className="text-[11px] font-bold text-[#EB001B]">●●</span>
        <span className="text-[11px] font-semibold text-[#006FCF]">AMEX</span>
      </div>

      <div
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${t.colors.borderStrong}` }}
      >
        <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}>
          <p className="mb-1 text-[12px] text-[#6a6a6a]">Kortnummer</p>
          <CardNumberElement options={fieldStyle} />
        </div>
        <div className="grid grid-cols-2">
          <div
            className="px-4 py-3.5"
            style={{
              borderBottom: `1px solid ${t.colors.hairlineSoft}`,
              borderRight: `1px solid ${t.colors.hairlineSoft}`,
            }}
          >
            <p className="mb-1 text-[12px] text-[#6a6a6a]">Utgångsdatum</p>
            <CardExpiryElement options={fieldStyle} />
          </div>
          <div
            className="px-4 py-3.5"
            style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
          >
            <p className="mb-1 text-[12px] text-[#6a6a6a]">CVV</p>
            <CardCvcElement options={fieldStyle} />
          </div>
        </div>
        <div style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}>
          <input
            className={inputClass}
            placeholder="Förnamn"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            autoComplete="cc-given-name"
          />
        </div>
        <div style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}>
          <input
            className={inputClass}
            placeholder="Efternamn"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            autoComplete="cc-family-name"
          />
        </div>
        <div style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}>
          <input
            className={inputClass}
            placeholder="Postnummer"
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <select
            className={`${inputClass} appearance-none`}
            value={country}
            onChange={e => setCountry(e.target.value)}
            aria-label="Land/region"
          >
            <option value="SE">Sverige</option>
            <option value="NO">Norge</option>
            <option value="DK">Danmark</option>
            <option value="FI">Finland</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[14px]" style={{ color: t.colors.error }}>
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="link"
          onClick={onClose}
          className="h-auto p-0 text-[16px] font-medium text-[#222222] underline"
        >
          Avbryt
        </Button>
        <Button
          type="submit"
          disabled={!stripe || saving}
          className="h-12 rounded-lg bg-[#222222] px-6 text-[16px] font-medium text-white hover:bg-[#000]"
        >
          {saving ? 'Sparar…' : 'Klar'}
        </Button>
      </div>
    </form>
  )
}

export default function AddPaymentMethodModal({
  open,
  onClose,
  onSaved,
  defaultFirstName,
  defaultLastName,
}: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Stäng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-card-title"
        className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl sm:p-8"
      >
        <div className="relative mb-6 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Stäng"
            className="absolute left-0 h-9 w-9 text-[#222222]"
          >
            ✕
          </Button>
          <h2 id="add-card-title" className="text-[18px] font-semibold text-[#222222]">
            Lägg till kortuppgifter
          </h2>
        </div>

        <Elements stripe={stripePromise}>
          <AddCardForm
            onClose={onClose}
            onSaved={onSaved}
            defaultFirstName={defaultFirstName}
            defaultLastName={defaultLastName}
          />
        </Elements>
      </div>
    </div>
  )
}
