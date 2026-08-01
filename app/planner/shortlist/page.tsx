import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GuestAppChrome from '@/components/GuestAppChrome'
import Container from '@/components/Container'
import RecentlyViewedCard from '@/components/wishlist/RecentlyViewedCard'
import CreateWishlistButton from './CreateWishlistButton'

export const metadata = { title: 'Önskelistor' }

type WishlistRow = {
  id: string
  name: string
  share_token: string
  created_at: string
}

export default async function WishlistsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signup?next=/planner/shortlist')

  const { data: lists } = await supabase
    .from('shortlists')
    .select('id, name, share_token, created_at')
    .eq('planner_id', user.id)
    .order('created_at', { ascending: false })

  const wishlists = (lists ?? []) as WishlistRow[]
  const ids = wishlists.map(l => l.id)

  const coverByList = new Map<string, { count: number; photos: string[] }>()
  for (const id of ids) coverByList.set(id, { count: 0, photos: [] })

  if (ids.length > 0) {
    const { data: items } = await supabase
      .from('shortlist_items')
      .select('shortlist_id, added_at, provider_profiles(photos)')
      .in('shortlist_id', ids)
      .order('added_at', { ascending: false })

    for (const item of items ?? []) {
      const entry = coverByList.get(item.shortlist_id)
      if (!entry) continue
      entry.count += 1
      if (entry.photos.length >= 4) continue
      const raw = item.provider_profiles as
        | { photos: string[] | null }
        | { photos: string[] | null }[]
        | null
      const profile = Array.isArray(raw) ? raw[0] : raw
      const photo = profile?.photos?.[0]
      if (photo) entry.photos.push(photo)
    }
  }

  return (
    <GuestAppChrome>
      <Container>
        <div className="pt-10 pb-16 sm:pt-12">
          <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.04em] text-[#222222] mb-10">
            Önskelistor
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6">
            <RecentlyViewedCard />

            {wishlists.map(list => {
              const meta = coverByList.get(list.id) ?? { count: 0, photos: [] }
              return (
                <Link
                  key={list.id}
                  href={`/planner/shortlist/${list.id}`}
                  className="group block min-w-0"
                >
                  <WishlistCover photos={meta.photos} />
                  <p className="mt-3 text-[15px] font-semibold text-[#222222] leading-5 truncate">
                    {list.name || 'Favoriter'}
                  </p>
                  <p className="text-[15px] text-[#6a6a6a] leading-5">
                    {meta.count === 0
                      ? '0 sparade'
                      : `${meta.count} ${meta.count === 1 ? 'sparad' : 'sparade'}`}
                  </p>
                </Link>
              )
            })}

            {/* Airbnb creates via heart; keep a subtle create card when empty of real lists */}
            {wishlists.length === 0 && (
              <div className="min-w-0">
                <CreateWishlistButton plannerId={user.id} variant="card" />
              </div>
            )}
          </div>
        </div>
      </Container>
    </GuestAppChrome>
  )
}

function WishlistCover({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return (
      <div
        className="aspect-square bg-[#f2f2f2] flex items-center justify-center transition group-hover:brightness-[0.97]"
        style={{ borderRadius: 16 }}
      >
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M16 28s-12-7.5-12-15a6.5 6.5 0 0 1 12-3.5A6.5 6.5 0 0 1 28 13c0 7.5-12 15-12 15z"
            stroke="#b0b0b0"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    )
  }

  if (photos.length === 1) {
    return (
      <div
        className="relative aspect-square overflow-hidden bg-[#ebebeb] transition group-hover:brightness-[0.97]"
        style={{ borderRadius: 16 }}
      >
        <Image src={photos[0]} alt="" fill className="object-cover" sizes="280px" />
      </div>
    )
  }

  return (
    <div
      className="aspect-square overflow-hidden grid grid-cols-2 grid-rows-2 gap-[2px] bg-white transition group-hover:brightness-[0.97]"
      style={{ borderRadius: 16 }}
    >
      {photos.slice(0, 4).map((src, i) => (
        <div key={i} className="relative bg-[#ebebeb]">
          <Image src={src} alt="" fill className="object-cover" sizes="140px" />
        </div>
      ))}
      {photos.length < 4 &&
        Array.from({ length: 4 - photos.length }).map((_, i) => (
          <div key={`e-${i}`} className="bg-[#f2f2f2]" />
        ))}
    </div>
  )
}
