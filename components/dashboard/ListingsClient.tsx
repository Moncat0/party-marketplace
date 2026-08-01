'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { settingsTokens as t } from '@/components/settings/tokens'
import { formatCategoryFromSlug, resolveCategorySlug } from '@/lib/categories'
import { MAX_SERVICES_PER_PROVIDER } from '@/lib/services'
import { shareServiceListing } from '@/lib/service-share'
import { track } from '@/lib/posthog'

export type HostListing = {
  id: string
  title: string | null
  city: string | null
  category_slug?: string | null
  category_tags: string[] | null
  photos: string[] | null
  is_published: boolean
  is_disabled: boolean
  created_at: string
}

type Props = {
  listings: HostListing[]
  maxServices?: number
}

export default function ListingsClient({
  listings,
  maxServices = MAX_SERVICES_PER_PROVIDER,
}: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const canCreate = listings.length < maxServices

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1
          className="text-[32px] font-semibold leading-tight tracking-[-0.6px]"
          style={{ color: t.colors.ink }}
        >
          {listings.length === 1 ? 'Din tjänst' : 'Dina tjänster'}
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
          {canCreate ? (
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="Skapa tjänst"
              className="h-10 w-10 rounded-full border-[#dddddd]"
            >
              <Link href="/dashboard/listings/new">
                <PlusIcon />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-[#dddddd] p-10">
          <p className="text-[16px] font-semibold" style={{ color: t.colors.ink }}>
            Du har ingen tjänst ännu
          </p>
          <p className="text-[14px]" style={{ color: t.colors.muted }}>
            Skapa din tjänst för att synas för planerare i Stockholm. Du kan ha upp till{' '}
            {maxServices} tjänster.
          </p>
          <Button asChild variant="dark" className="rounded-xl">
            <Link href="/dashboard/listings/new">Skapa tjänst</Link>
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {canCreate ? (
            <Link
              href="/dashboard/listings/new"
              className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dddddd] p-8 text-center transition hover:border-[#222222]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dddddd] text-[#222222]">
                <PlusIcon />
              </span>
              <span className="text-[15px] font-semibold text-[#222222]">Lägg till tjänst</span>
              <span className="text-[13px] text-[#6a6a6a]">
                {listings.length}/{maxServices} använda
              </span>
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          {/* Force card grid on small screens — table is desktop-only */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:hidden">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="hidden md:block">
            <ListingTable listings={listings} />
          </div>
        </>
      )}
    </div>
  )
}

function statusMeta(listing: HostListing) {
  if (listing.is_published && listing.is_disabled) {
    return { label: 'Pausad', color: '#b0b0b0' }
  }
  if (listing.is_published) {
    return { label: 'Publicerad', color: t.colors.success }
  }
  return { label: 'Pågående', color: t.colors.primary }
}

function isLive(listing: HostListing) {
  return listing.is_published && !listing.is_disabled
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

function editHref(listing: HostListing) {
  return listing.is_published
    ? `/dashboard/listings/${listing.id}/edit`
    : `/dashboard/listings/new/flow?resume=1&id=${listing.id}`
}

function ListingActions({ listing }: { listing: HostListing }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [shareHint, setShareHint] = useState<string | null>(null)

  async function setDisabled(next: boolean) {
    setError(null)
    const res = await fetch(`/api/services/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_disabled: next }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? 'Kunde inte uppdatera')
      return
    }
    startTransition(() => router.refresh())
  }

  async function remove() {
    setError(null)
    const res = await fetch(`/api/services/${listing.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? 'Kunde inte ta bort')
      setConfirmDelete(false)
      return
    }
    startTransition(() => router.refresh())
  }

  async function handleShare() {
    setShareHint(null)
    setError(null)
    try {
      const result = await shareServiceListing({
        id: listing.id,
        title: listing.title,
        city: listing.city,
        category_slug: listing.category_slug,
        category_tags: listing.category_tags,
        origin: window.location.origin,
      })
      if (!result.shared) return
      track('provider_shared', {
        provider_id: listing.id,
        method: result.method,
        source: 'dashboard_listings',
      })
      if (result.method === 'copy') {
        setShareHint('Meddelande kopierat')
        setTimeout(() => setShareHint(null), 2000)
      }
    } catch {
      setError('Kunde inte dela')
    }
  }

  const live = isLive(listing)

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-full border-[#dddddd]">
          <Link href={editHref(listing)}>Redigera</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full border-[#dddddd]">
          <Link href={`/tjanster/${listing.id}`}>Förhandsgranska</Link>
        </Button>
        {live ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void handleShare()}
            className="rounded-full border-[#dddddd]"
          >
            Dela
          </Button>
        ) : null}
        {listing.is_published ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void setDisabled(!listing.is_disabled)}
            className="rounded-full border-[#dddddd]"
          >
            {listing.is_disabled ? 'Aktivera' : 'Pausa'}
          </Button>
        ) : null}
        {!confirmDelete ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
            className="rounded-full border-[#dddddd] text-[#c13515] hover:bg-[#fff8f6]"
          >
            Ta bort
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="dark"
              size="sm"
              disabled={pending}
              onClick={() => void remove()}
              className="rounded-full bg-[#c13515] hover:bg-[#a12b11]"
            >
              Bekräfta borttagning
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setConfirmDelete(false)}
              className="rounded-full"
            >
              Avbryt
            </Button>
          </>
        )}
      </div>
      {error ? <p className="text-[13px] text-[#c13515]">{error}</p> : null}
      {shareHint ? <p className="text-[13px] text-[#6a6a6a]">{shareHint}</p> : null}
      {confirmDelete ? (
        <p className="text-[12px] text-[#6a6a6a]">
          Tipsa: pausa hellre än att ta bort. Omdömen behålls på din profil.
        </p>
      ) : null}
      {!live && listing.is_published === false ? (
        <p className="text-[12px] text-[#6a6a6a]">Publicera för att kunna dela länken.</p>
      ) : null}
      {listing.is_disabled ? (
        <p className="text-[12px] text-[#6a6a6a]">
          Pausad — syns inte i sök eller på startsidan.
        </p>
      ) : null}
    </div>
  )
}

function ListingCard({ listing }: { listing: HostListing }) {
  const status = statusMeta(listing)
  const photo = listing.photos?.[0]

  return (
    <div className="w-full min-w-0">
      <Link href={editHref(listing)} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#ebebeb]">
          {photo ? (
            <Image
              src={photo}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, 320px"
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
      <ListingActions listing={listing} />
    </div>
  )
}

function ListingTable({ listings }: { listings: HostListing[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#ebebeb] text-[12px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
            <th className="pb-3 pr-4 font-semibold">Tjänst</th>
            <th className="pb-3 pr-4 font-semibold">Typ</th>
            <th className="pb-3 pr-4 font-semibold">Plats</th>
            <th className="pb-3 pr-4 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          {listings.map(listing => {
            const status = statusMeta(listing)
            const photo = listing.photos?.[0]
            return (
              <tr key={listing.id} className="border-b border-[#ebebeb] align-top">
                <td className="py-4 pr-4">
                  <Link href={editHref(listing)} className="flex items-center gap-3">
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
                <td className="py-4 pr-4">
                  <span className="inline-flex items-center gap-1.5 text-[14px] text-[#222222]">
                    <span className="h-2 w-2 rounded-full" style={{ background: status.color }} />
                    {status.label}
                  </span>
                </td>
                <td className="py-4">
                  <ListingActions listing={listing} />
                </td>
              </tr>
            )
          })}
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
