'use client'

import type { FormEvent } from 'react'
import DatePickerField from '@/components/ui/DatePickerField'
import SelectField from '@/components/ui/SelectField'

type BookingData = {
  event_date: string
  event_type: string
  event_location: string
  guest_count: string
  description: string
}

type Props = {
  priceLabel: string | null
  reviewCount: number
  avgRating: number | null
  bookingData: BookingData
  onChange: (next: BookingData) => void
  onSubmit: (e: FormEvent) => void
  submitting: boolean
  error: string | null
  loggedIn: boolean
  onRequireLogin: () => void
}

const EVENT_TYPES = [
  { value: 'birthday', label: 'Födelsedag' },
  { value: 'wedding', label: 'Bröllop' },
  { value: 'corporate', label: 'Företagsevent' },
  { value: 'kids', label: 'Barnkalas' },
  { value: 'other', label: 'Annat' },
]

/** Sticky booking widget — Airbnb Reserve card chrome, custom date + select. */
export default function ListingReservation({
  priceLabel,
  reviewCount,
  avgRating,
  bookingData,
  onChange,
  onSubmit,
  submitting,
  error,
  loggedIn,
  onRequireLogin,
}: Props) {
  return (
    <div
      className="bg-white p-6"
      style={{
        borderRadius: 12,
        border: '1px solid rgba(221,221,221,1)',
        boxShadow: 'rgba(0, 0, 0, 0.12) 0px 6px 16px',
      }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-6">
        <div>
          <span className="text-[22px] font-semibold text-[#222222]">
            {priceLabel ?? 'Kontakta för pris'}
          </span>
        </div>
        {reviewCount > 0 && avgRating != null && (
          <div className="text-[14px] text-[#222222] whitespace-nowrap">
            <span className="font-semibold">★ {avgRating.toFixed(1)}</span>
            <span className="text-[#6a6a6a]"> · </span>
            <span className="underline text-[#6a6a6a]">
              {reviewCount} recensioner
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={e => {
          if (!loggedIn) {
            e.preventDefault()
            onRequireLogin()
            return
          }
          onSubmit(e)
        }}
      >
        <div
          className="mb-4 overflow-visible"
          style={{
            borderRadius: 8,
            border: '1px solid #b0b0b0',
          }}
        >
          <div className="border-b border-[#b0b0b0]">
            <DatePickerField
              label="Datum"
              value={bookingData.event_date}
              onChange={event_date => onChange({ ...bookingData, event_date })}
              placeholder="yyyy-mm-dd"
            />
          </div>
          <div className="border-b border-[#b0b0b0]">
            <SelectField
              label="Typ av event"
              value={bookingData.event_type}
              onChange={event_type => onChange({ ...bookingData, event_type })}
              options={EVENT_TYPES}
              placeholder="Välj typ..."
            />
          </div>
          <div className="grid grid-cols-2">
            <div className="px-3 py-2.5 border-r border-[#b0b0b0]">
              <label className="block text-[10px] font-bold text-[#222222] uppercase tracking-wide">
                Plats
              </label>
              <input
                type="text"
                value={bookingData.event_location}
                onChange={e =>
                  onChange({ ...bookingData, event_location: e.target.value })
                }
                placeholder="Stockholm"
                className="w-full text-[14px] text-[#222222] placeholder-[#717171] focus:outline-none bg-transparent mt-0.5"
              />
            </div>
            <div className="px-3 py-2.5">
              <label className="block text-[10px] font-bold text-[#222222] uppercase tracking-wide">
                Gäster
              </label>
              <input
                type="number"
                min="1"
                value={bookingData.guest_count}
                onChange={e =>
                  onChange({ ...bookingData, guest_count: e.target.value })
                }
                placeholder="30"
                className="w-full text-[14px] text-[#222222] placeholder-[#717171] focus:outline-none bg-transparent mt-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        <div
          className="mb-4"
          style={{ borderRadius: 8, border: '1px solid #b0b0b0' }}
        >
          <div className="px-3 py-2.5">
            <label className="block text-[10px] font-bold text-[#222222] uppercase tracking-wide">
              Meddelande
            </label>
            <textarea
              value={bookingData.description}
              onChange={e =>
                onChange({ ...bookingData, description: e.target.value })
              }
              placeholder="Berätta om ditt event..."
              rows={2}
              className="w-full text-[14px] text-[#222222] placeholder-[#717171] focus:outline-none bg-transparent resize-none mt-0.5"
            />
          </div>
        </div>

        {error && <p className="text-[14px] text-[#c13515] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 text-[16px] font-semibold text-white bg-[#FF6B35] hover:bg-[#e55a26] transition-colors disabled:opacity-70 disabled:cursor-not-allowed rounded-xl"
        >
          {submitting ? 'Skickar...' : 'Skicka förfrågan'}
        </button>

        <p className="text-center text-[14px] text-[#222222] mt-4">
          Du debiteras ingenting ännu
        </p>
      </form>
    </div>
  )
}
