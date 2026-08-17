'use client'

import Image from 'next/image'
type Props = {
  hostName: string | null
  hostAvatar: string | null
  bio: string | null
  city: string | null
  memberSince: string | null
  reviewCount: number
  avgRating: number | null
}

function yearsOnPlatform(iso: string | null): string {
  if (!iso) return 'Ny på Gigtorget'
  const ms = Date.now() - new Date(iso).getTime()
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000))
  if (years < 1) {
    const months = Math.max(1, Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000)))
    return months === 1 ? '1 månad' : `${months} månader`
  }
  return years === 1 ? '1 år' : `${years} år`
}

/** Airbnb-style “Meet your host” — full width under listing details. */
export default function ListingMeetProvider({
  hostName,
  hostAvatar,
  bio,
  city,
  memberSince,
  reviewCount,
  avgRating,
}: Props) {
  const name = hostName ?? 'Talangen'
  const initial = name.charAt(0).toUpperCase()
  const tenure = yearsOnPlatform(memberSince)

  return (
    <section className="border-t border-[#ebebeb] py-10 md:py-12">
      <h2 className="text-[22px] font-semibold text-[#222222] tracking-[-0.02em] mb-6">
        Träffa din leverantör
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-black/[0.04] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex flex-col items-center text-center flex-shrink-0">
                {hostAvatar ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-full">
                    <Image
                      src={hostAvatar}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#222222] text-3xl font-semibold text-white">
                    {initial}
                  </div>
                )}
                <p className="mt-3 text-[22px] font-semibold text-[#222222] leading-tight">
                  {name}
                </p>
                <p className="text-[14px] text-[#6a6a6a] mt-0.5">Talang på Gigtorget</p>
              </div>

              <div className="flex-1 w-full sm:border-l sm:border-[#ebebeb] sm:pl-6 space-y-3">
                <StatRow
                  value={String(reviewCount)}
                  label={reviewCount === 1 ? 'Recension' : 'Recensioner'}
                />
                {reviewCount > 0 && avgRating != null && (
                  <StatRow value={`${avgRating.toFixed(2)}★`} label="Betyg" />
                )}
                <StatRow value={tenure} label="På Gigtorget" last />
              </div>
            </div>
          </div>

          {city && (
            <p className="text-[16px] text-[#222222] flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0" aria-hidden>
                <PinIcon />
              </span>
              <span>
                Baserad i <span className="font-medium">{city}</span>
              </span>
            </p>
          )}

          {bio && (
            <p className="text-[16px] text-[#222222] leading-[1.5] whitespace-pre-line">{bio}</p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-[18px] font-semibold text-[#222222] mb-2">
              {name} är talang på Gigtorget
            </h3>
            <p className="text-[16px] text-[#222222] leading-[1.5]">
              Talanger på Gigtorget är lokala proffs — DJ:s, fotografer, sminkartister och mer —
              som hjälper dig skapa oförglömliga fester i Stockholm.
            </p>
          </div>

          <div>
            <h3 className="text-[18px] font-semibold text-[#222222] mb-2">Uppgifter</h3>
            <ul className="space-y-1 text-[16px] text-[#222222]">
              <li>Svarar vanligtvis inom ett dygn</li>
              {city && <li>Verkar i {city}</li>}
            </ul>
          </div>

          <div className="border-t border-[#ebebeb] pt-6 mt-auto">
            <p className="text-[12px] text-[#6a6a6a] leading-relaxed flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5 text-[#FF2E8A]" aria-hidden>
                <ShieldIcon />
              </span>
              För att skydda din betalning och kommunikation, använd alltid Gigtorget när du bokar
              och pratar med talanger.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatRow({
  value,
  label,
  last = false,
}: {
  value: string
  label: string
  last?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2 ${
        last ? '' : 'border-b border-[#ebebeb]'
      }`}
    >
      <span className="text-[22px] font-semibold text-[#222222] tabular-nums">{value}</span>
      <span className="text-[14px] text-[#222222] text-right">{label}</span>
    </div>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l8 3v6c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V5l8-3z" />
    </svg>
  )
}
