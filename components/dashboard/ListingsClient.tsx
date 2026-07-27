'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { settingsTokens as t } from '@/components/settings/tokens'
import { formatCategoryFromSlug, resolveCategorySlug } from '@/lib/categories'

export type HostListing = {
  id: string
  title: string | null
  city: string | null
  category_slug?: string | null
  category_tags: string[] | null
  photos: string[] | null
  is_published: boolean
  created_at: string
}

type Props = {
  listing: HostListing | null
}

export default function ListingsClient({ listing }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1
          className="text-[32px] font-semibold leading-tight tracking-[-0.6px]"
          style={{ color: t.colors.ink }}
        >
          Din tjänst
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={view === 'grid' ? 'Lista' : 'Rutnät'}
            aria-pressed={view === 'list'}
            onClick={() => setView(v => (v === 'grid' ? 'list' : 'grid'))}
            className="h-10 w-10 rounded-full border-[#dddddd]"
          >
            {view === 'grid' ? <ListIcon /> : <GridIcon />}
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Skapa eller slutför tjänst"
            className="h-10 w-10 rounded-full border-[#dddddd]"
          >
            <Link href="/dashboard/listings/new">
              <PlusIcon />
            </Link>
          </Button>
        </div>
      </div>

      {!listing ? (
        <div
          className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-[#dddddd] p-10"
        >
          <p className="text-[16px] font-semibold" style={{ color: t.colors.ink }}>
            Du har ingen tjänst ännu
          </p>
          <p className="text-[14px]" style={{ color: t.colors.muted }}>
            Skapa din tjänst för att synas för planerare i Stockholm.
          </p>
          <Button asChild variant="dark" className="rounded-xl">
            <Link href="/dashboard/listings/new">Skapa tjänst</Link>
          </Button>
        </div>
      ) : view === 'grid' ? (
        <ListingCard listing={listing} />
      ) : (
        <ListingTable listing={listing} />
      )}
    </div>
  )
}

function statusMeta(published: boolean) {
  return published
    ? { label: 'Publicerad', color: t.colors.success }
    : { label: 'Pågående', color: t.colors.primary }
}

function listingTitle(listing: HostListing) {
  if (listing.title?.trim()) return listing.title
  const started = new Date(listing.created_at).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `Din tjänst påbörjad ${started}`
}

function listingType(listing: HostListing) {
  return (
    formatCategoryFromSlug(
      resolveCategorySlug({
        category_slug: listing.category_slug,
        category_tags: listing.category_tags,
      })
    ) ?? 'Tjänst'
  )
}

function ListingCard({ listing }: { listing: HostListing }) {
  const status = statusMeta(listing.is_published)
  const photo = listing.photos?.[0]

  return (
    <Link href="/dashboard/profile" className="group block max-w-sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#ebebeb]">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="400px"
          />
        ) : null}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#222222] shadow-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: status.color }} />
          {status.label}
        </span>
      </div>
      <p className="mt-3 text-[15px] font-semibold leading-5 text-[#222222]">
        {listingTitle(listing)}
      </p>
      <p className="mt-0.5 text-[14px] text-[#6a6a6a]">
        {listingType(listing)}
        {listing.city ? ` i ${listing.city}, Sverige` : ' i Stockholm, Sverige'}
      </p>
    </Link>
  )
}

function ListingTable({ listing }: { listing: HostListing }) {
  const status = statusMeta(listing.is_published)
  const photo = listing.photos?.[0]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#ebebeb] text-[12px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
            <th className="pb-3 pr-4 font-semibold">Tjänst</th>
            <th className="pb-3 pr-4 font-semibold">Typ</th>
            <th className="pb-3 pr-4 font-semibold">Plats</th>
            <th className="pb-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#ebebeb]">
            <td className="py-4 pr-4">
              <Link href="/dashboard/profile" className="flex items-center gap-3">
                <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[#ebebeb]">
                  {photo ? (
                    <Image src={photo} alt="" fill className="object-cover" sizes="48px" />
                  ) : null}
                </span>
                <span className="text-[14px] font-medium text-[#222222]">
                  {listingTitle(listing)}
                </span>
              </Link>
            </td>
            <td className="py-4 pr-4 text-[14px] text-[#222222]">{listingType(listing)}</td>
            <td className="py-4 pr-4 text-[14px] text-[#222222]">
              {listing.city ? `${listing.city}, Sverige` : 'Stockholm, Sverige'}
            </td>
            <td className="py-4">
              <span className="inline-flex items-center gap-1.5 text-[14px] text-[#222222]">
                <span className="h-2 w-2 rounded-full" style={{ background: status.color }} />
                {status.label}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
