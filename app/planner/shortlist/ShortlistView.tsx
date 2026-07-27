'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import GuestAppChrome from '@/components/GuestAppChrome'
import Container from '@/components/Container'
import ListingCard from '@/components/listings/ListingCard'
import WishlistSettingsModal from '@/components/wishlist/WishlistSettingsModal'
import { Button } from '@/components/ui/button'
import { removeWishlistItem, updateItemNote } from '@/lib/wishlists'
import { track } from '@/lib/posthog'

export type WishlistItem = {
  id: string
  service_id: string
  note: string | null
  services: {
    id: string
    title: string | null
    city: string | null
    photos: string[]
    category_tags: string[]
    price_range_min: number | null
    price_range_max: number | null
    users: { name: string | null } | null
    avgRating: number | null
    reviewCount: number
  } | null
}

type Props = {
  shortlistId: string
  shareToken: string
  name: string
  plannerId: string
  items: WishlistItem[]
}

export default function ShortlistView({
  shortlistId,
  shareToken,
  name: initialName,
  plannerId,
  items: initial,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [items, setItems] = useState(initial)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [noteEditing, setNoteEditing] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/shortlist/${shareToken}`
    track('shortlist_shared', { shortlist_id: shortlistId, item_count: items.length })
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${name} på FESTEN.`, url })
        return
      } catch {
        // fall through
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleUnsave(itemId: string) {
    await removeWishlistItem(itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function saveNote(itemId: string) {
    await updateItemNote(itemId, noteDraft)
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, note: noteDraft.trim() || null } : i))
    )
    setNoteEditing(null)
  }

  return (
    <GuestAppChrome flush>
      <Container>
        <div className="pt-6 pb-20">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/planner/shortlist')}
            className="mb-6 -ml-1 size-8 rounded-full"
            aria-label="Tillbaka"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.04em] text-[#222222]">
              {name}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="mt-1 size-8 rounded-full"
              aria-label="Inställningar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
                <circle cx="3.5" cy="9" r="1.5" />
                <circle cx="9" cy="9" r="1.5" />
                <circle cx="14.5" cy="9" r="1.5" />
              </svg>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-10">
            <Button
              type="button"
              variant="outline"
              onClick={handleShare}
              className="h-10 rounded-full px-4 text-[14px] font-semibold hover:border-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none" aria-hidden className="mr-1.5">
                <path
                  d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9M16 4v18M8 11l8-8 8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {copied ? 'Kopierad' : 'Dela'}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[16px] font-medium text-[#222] mb-2">Inga sparade talanger</p>
              <p className="text-[14px] text-[#6a6a6a] mb-6">
                Spara talanger du gillar så dyker de upp här.
              </p>
              <Link
                href="/"
                className="inline-flex h-12 items-center px-6 text-[16px] font-semibold text-white bg-[#222] rounded-lg"
              >
                Utforska
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
              {items.map(item => {
                const p = item.services
                if (!p) return null
                return (
                  <div key={item.id} className="min-w-0">
                    <ListingCard
                      data={{
                        id: p.id,
                        title: p.title,
                        city: p.city,
                        photos: p.photos,
                        category_tags: p.category_tags,
                        users: p.users,
                        avgRating: p.avgRating,
                        reviewCount: p.reviewCount,
                      }}
                      isLoggedIn
                      plannerId={plannerId}
                      initialSaved
                      onUnsave={() => handleUnsave(item.id)}
                    />
                    {noteEditing === item.id ? (
                      <div className="mt-2">
                        <textarea
                          autoFocus
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                          rows={2}
                          placeholder="Skriv en anteckning..."
                          className="w-full px-3 py-2 text-[13px] border border-[#b0b0b0] rounded-lg focus:outline-none focus:border-[#222] resize-none"
                        />
                        <div className="mt-1.5 flex gap-2">
                          <Button
                            type="button"
                            variant="dark"
                            size="sm"
                            onClick={() => saveNote(item.id)}
                            className="h-8 px-3 text-[13px]"
                          >
                            Spara
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNoteEditing(null)}
                            className="h-8 px-3 text-[13px]"
                          >
                            Avbryt
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setNoteEditing(item.id)
                          setNoteDraft(item.note ?? '')
                        }}
                        className="mt-2 h-auto w-full justify-start rounded-xl bg-secondary px-3 py-2 text-left text-[13px] text-muted-foreground hover:bg-muted line-clamp-2"
                      >
                        {item.note ? (
                          <span className="text-foreground">{item.note}</span>
                        ) : (
                          'Lägg till anteckning'
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Container>

      <WishlistSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        shortlistId={shortlistId}
        name={name}
        shareToken={shareToken}
        itemCount={items.length}
        onRenamed={setName}
      />
    </GuestAppChrome>
  )
}
