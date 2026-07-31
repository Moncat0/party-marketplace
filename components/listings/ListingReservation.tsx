'use client'

import type { FormEvent } from 'react'
import DatePickerField from '@/components/ui/DatePickerField'
import OccasionMultiSelect from '@/components/ui/OccasionMultiSelect'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import { Button } from '@/components/ui/button'
import type { BookingFormData } from '@/lib/booking-draft'
import { normalizeOccasions } from '@/lib/occasions'

type Props = {
  priceLabel: string | null
  reviewCount: number
  avgRating: number | null
  bookingData: BookingFormData
  onChange: (next: BookingFormData) => void
  onSubmit: (e: FormEvent) => void
  submitting: boolean
  error: string | null
  loggedIn: boolean
  onRequireLogin: () => void
  /** Occasions this service supports — booking only offers these. */
  serviceOccasions?: string[] | null
}

/** Sticky booking widget — Airbnb Reserve card chrome, custom date + occasion chips. */
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
  serviceOccasions,
}: Props) {
  // Never fall back to the full occasion catalog — only this listing's tillfällen.
  const optionSlugs = normalizeOccasions(serviceOccasions)
  const hasListingOccasions = optionSlugs.length > 0

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
          <div className="border-b border-[#b0b0b0] px-3 py-2.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#222222]">
              Tillfälle
            </p>
            {hasListingOccasions ? (
              <>
                <OccasionMultiSelect
                  value={bookingData.occasions.filter(o =>
                    optionSlugs.includes(o as (typeof optionSlugs)[number])
                  )}
                  options={optionSlugs}
                  size="sm"
                  onChange={occasions => onChange({ ...bookingData, occasions })}
                />
                <p className="mt-2 text-[12px] text-[#6a6a6a]">
                  {optionSlugs.length === 1
                    ? 'Välj tillfället för ditt event.'
                    : 'Välj ett eller flera som passar tjänsten.'}
                </p>
              </>
            ) : (
              <p className="text-[13px] leading-snug text-[#6a6a6a]">
                Värden har inte angett tillfällen för den här tjänsten. Berätta gärna i
                meddelandet vilken typ av event det är.
              </p>
            )}
          </div>
          <div className="border-b border-[#b0b0b0] px-3 py-2.5">
            <label className="block text-[10px] font-bold text-[#222222] uppercase tracking-wide">
              Plats
            </label>
            <AddressAutocomplete
              value={bookingData.event_location}
              placeholder="Gatuadress eller lokal"
              inputClassName="mt-0.5"
              onChange={({ address, placeId, lat, lng }) =>
                onChange({
                  ...bookingData,
                  event_location: address,
                  event_place_id: placeId,
                  event_lat: lat,
                  event_lng: lng,
                })
              }
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

        {error && <p className="text-[14px] text-destructive mb-3">{error}</p>}

        <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-xl text-base font-semibold">
          {submitting ? 'Skickar...' : 'Skicka förfrågan'}
        </Button>

        <p className="text-center text-[14px] text-foreground mt-4">
          Du debiteras ingenting ännu
        </p>
      </form>
    </div>
  )
}
