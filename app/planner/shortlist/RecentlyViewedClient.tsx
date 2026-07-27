'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GuestAppChrome from '@/components/GuestAppChrome'
import Container from '@/components/Container'
import ListingCard from '@/components/listings/ListingCard'
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed'
import { createClient } from '@/lib/supabase'

type Card = {
  id: string
  title: string | null
  city: string | null
  photos: string[]
  users: { name: string | null } | null
}

export default function RecentlyViewedClient() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const recent = getRecentlyViewed()
    setItems(recent)
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      if (recent.length === 0) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('services')
        .select('id, title, city, photos, provider_profiles(users(name))')
        .in(
          'id',
          recent.map(r => r.id)
        )
        .eq('is_published', true)
    .eq('is_disabled', false)

      const byId = new Map((data ?? []).map(p => [p.id, p]))
      const ordered: Card[] = []
      for (const r of recent) {
        const p = byId.get(r.id)
        if (!p) continue
        const providerRaw = p.provider_profiles as unknown
        const provider = (Array.isArray(providerRaw) ? providerRaw[0] : providerRaw) as {
          users: { name: string | null } | { name: string | null }[] | null
        } | null
        const usersRaw = provider?.users ?? null
        const users = Array.isArray(usersRaw) ? usersRaw[0] ?? null : usersRaw
        ordered.push({
          id: p.id,
          title: p.title,
          city: p.city,
          photos: p.photos ?? [],
          users,
        })
      }
      setCards(ordered)
      setLoading(false)
    })()
  }, [])

  return (
    <GuestAppChrome flush>
      <Container>
        <div className="pt-8 pb-16">
          <Link
            href="/planner/shortlist"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#222222] hover:underline mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M7.5 2.5L4 6l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Önskelistor
          </Link>

          <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.04em] text-[#222222] mb-2">
            Nyligen visade
          </h1>
          <p className="text-[15px] text-[#6a6a6a] mb-10">
            {loading
              ? '…'
              : `${items.length} ${items.length === 1 ? 'visad' : 'visade'}`}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl bg-[#ebebeb]" />
                  <div className="h-4 w-2/3 mt-3 rounded bg-[#ebebeb]" />
                </div>
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[16px] font-medium text-[#222222] mb-2">Inget att visa än</p>
              <p className="text-[14px] text-[#6a6a6a] mb-6">
                Talanger du tittar på dyker upp här.
              </p>
              <Link
                href="/"
                className="inline-flex h-12 items-center px-6 text-[16px] font-semibold text-white bg-[#222222] rounded-lg"
              >
                Utforska
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
              {cards.map(c => (
                <ListingCard
                  key={c.id}
                  data={c}
                  isLoggedIn={!!userId}
                  plannerId={userId}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </GuestAppChrome>
  )
}
