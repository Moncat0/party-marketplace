'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { track } from '@/lib/posthog'

type Item = {
  id: string
  provider_profile_id: string
  provider_profiles: {
    id: string
    service_title: string | null
    city: string | null
    photos: string[]
    category_tags: string[]
    users: { name: string | null } | null
  } | null
}

type Props = {
  shortlistId: string
  shareToken: string
  items: Item[]
}

export default function ShortlistView({ shortlistId, shareToken, items: initial }: Props) {
  const [items, setItems] = useState(initial)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  async function handleRemove(itemId: string) {
    const supabase = createClient()
    await supabase.from('shortlist_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function handleShare() {
    const url = `${window.location.origin}/shortlist/${shareToken}`
    track('shortlist_shared', { shortlist_id: shortlistId, item_count: items.length })
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Min lista på FESTEN.', url })
        return
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — show the URL visibly instead
      setShareUrl(url)
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF8F3] px-4 py-10">
      <div className="mx-auto max-w-sm">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-[#5F5E5A] hover:text-[#1A1A2E]">← Tillbaka</Link>
            <h1 className="mt-1 text-2xl font-bold text-[#1A1A2E]">Min lista</h1>
            <p className="text-sm text-[#5F5E5A]">{items.length} {items.length === 1 ? 'talang' : 'talanger'}</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleShare}
              className="rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
            >
              {copied ? '✓ Kopierad!' : '↗ Dela lista'}
            </button>
          )}
        </div>

        {shareUrl && (
          <div className="mb-4 rounded-xl border border-[#E8E3DC] bg-white p-3">
            <p className="text-xs text-[#5F5E5A] mb-1">Kopiera länken:</p>
            <input
              readOnly
              value={shareUrl}
              onFocus={e => e.target.select()}
              className="w-full text-xs text-[#1A1A2E] bg-transparent outline-none"
            />
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">♡</p>
            <p className="text-sm text-[#5F5E5A]">Du har inga sparade talanger ännu.</p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#FF6B35] hover:underline">
              Hitta talanger →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const p = item.provider_profiles
              if (!p) return null
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <Link href={`/providers/${p.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0EDE8]">
                      {p.photos[0] ? (
                        <Image src={p.photos[0]} alt="" fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl">🎉</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#1A1A2E] truncate">{p.service_title}</p>
                      {p.users?.name && (
                        <p className="text-xs text-[#5F5E5A] truncate">{p.users.name}</p>
                      )}
                      {p.city && (
                        <p className="text-xs text-[#5F5E5A]">📍 {p.city}</p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="flex-shrink-0 rounded-lg p-2 text-[#5F5E5A] hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Ta bort"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
