'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { track } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import WishlistSavedToast, {
  type WishlistToastData,
} from '@/components/wishlist/WishlistSavedToast'
import {
  addToWishlist,
  createWishlist,
  fetchUserWishlists,
  getCachedWishlists,
  setWishlistCache,
  type WishlistSummary,
} from '@/lib/wishlists'
import { lockBodyScroll } from '@/lib/lock-body-scroll'

type Props = {
  open: boolean
  onClose: () => void
  /** Re-open picker from the saved toast “Ändra”. */
  onOpen: () => void
  providerId: string
  plannerId: string
  /** Listing / provider photo for the saved toast. */
  providerPhoto?: string | null
  onSaved: () => void
}

type Step = 'pick' | 'create'

/**
 * Airbnb “Save to wishlist” modal:
 * - Always 2-column cover grid
 * - Body scrolls after ~6 lists (3 rows); header + footer stay fixed
 * - Sticky footer: Create new wishlist
 * - On save → bottom-left toast with Change
 */
export default function WishlistSaveModal({
  open,
  onClose,
  onOpen,
  providerId,
  plannerId,
  providerPhoto = null,
  onSaved,
}: Props) {
  const [step, setStep] = useState<Step>('pick')
  const [lists, setLists] = useState<WishlistSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<WishlistToastData | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prefer cache so the picker opens with real lists (no 4-tile skeleton).
  // Soft-refresh in the background when we already have data.
  useLayoutEffect(() => {
    if (!open) return
    setError(null)
    setName('')
    setSaving(false)

    const cached = getCachedWishlists(plannerId)
    if (cached) {
      setLists(cached)
      setStep(cached.length === 0 ? 'create' : 'pick')
      setLoading(false)
    } else {
      setStep('pick')
      setLoading(true)
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchUserWishlists(plannerId, {
          force: !!cached,
        })
        if (cancelled) return
        setLists(data)
        setStep(data.length === 0 ? 'create' : 'pick')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, plannerId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const unlock = lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [open, onClose])

  const dismissToast = useCallback(() => setToast(null), [])

  function finishSave(wishlistName: string) {
    // Fill the heart before closing so remounts / duplicate cards stay in sync.
    onSaved()
    setToast({ wishlistName, photoUrl: providerPhoto })
    setSaving(false)
    onClose()
  }

  async function handleSelect(list: WishlistSummary) {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await addToWishlist(list.id, providerId)
      track('shortlist_item_saved', {
        provider_id: providerId,
        planner_id: plannerId,
        shortlist_id: list.id,
      })
      finishSave(list.name)
    } catch {
      setError('Kunde inte spara. Försök igen.')
      setSaving(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (saving || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const list = await createWishlist(plannerId, name.trim())
      await addToWishlist(list.id, providerId)
      track('shortlist_item_saved', {
        provider_id: providerId,
        planner_id: plannerId,
        shortlist_id: list.id,
      })
      setLists(prev => {
        const next = [
          {
            id: list.id,
            name: list.name || name.trim(),
            share_token: list.share_token,
            created_at: list.created_at,
            item_count: 1,
            cover_photos: providerPhoto ? [providerPhoto] : [],
          },
          ...prev,
        ]
        setWishlistCache(plannerId, next)
        return next
      })
      finishSave(list.name || name.trim())
    } catch {
      setError('Kunde inte skapa listan. Försök igen.')
      setSaving(false)
    }
  }

  if (!mounted) return null

  // While loading, always show pick chrome + skeleton (never empty create).
  const showCreate = !loading && step === 'create'
  const showPick = !loading && step === 'pick'
  const showSkeleton = loading

  return (
    <>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-modal-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Stäng"
              onClick={onClose}
            />

            <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] sm:max-w-[568px] sm:rounded-3xl">
              <div className="relative flex-shrink-0 px-6 pb-4 pt-6">
                {showCreate && lists.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setStep('pick')
                      setError(null)
                    }}
                    className="absolute left-4 top-4 h-8 w-8 rounded-full"
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
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-4 top-4 h-8 w-8 rounded-full"
                    aria-label="Stäng"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M1 1l12 12M13 1L1 13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Button>
                )}
                <h2
                  id="wishlist-modal-title"
                  className="text-center font-body text-[16px] font-semibold leading-5 text-foreground"
                >
                  {showCreate ? 'Namnge den här önskelistan' : 'Spara i en önskelista'}
                </h2>
              </div>

              <div
                className={
                  showCreate
                    ? 'flex-1 overflow-y-auto px-6 pb-2'
                    : 'max-h-[min(52vh,520px)] flex-1 overflow-y-auto overscroll-contain px-6 pb-2'
                }
              >
                {error && (
                  <p className="mb-4 text-[14px] leading-[18px] text-[#c13515]">{error}</p>
                )}

                {showSkeleton && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-4" aria-hidden>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-square rounded-xl bg-[#ebebeb]" />
                        <div className="mt-2 h-3.5 w-2/3 rounded bg-[#ebebeb]" />
                        <div className="mt-1.5 h-3.5 w-1/3 rounded bg-[#ebebeb]" />
                      </div>
                    ))}
                  </div>
                )}

                {showPick && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-4">
                    {lists.map(list => (
                      <button
                        key={list.id}
                        type="button"
                        disabled={saving}
                        onClick={() => handleSelect(list)}
                        className="group flex w-full min-w-0 flex-col items-stretch text-left disabled:opacity-60"
                      >
                        <WishlistCover photos={list.cover_photos} />
                        <p className="mt-2 truncate font-body text-[14px] font-medium leading-[18px] text-[#222222]">
                          {list.name}
                        </p>
                        <p className="font-body text-[14px] font-normal leading-[18px] text-[#6a6a6a]">
                          {list.item_count === 0
                            ? 'Tom'
                            : `${list.item_count} ${list.item_count === 1 ? 'sparad' : 'sparade'}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {showCreate && (
                  <form id="wishlist-create-form" onSubmit={handleCreate} className="pb-4">
                    <label className="block">
                      <span className="sr-only">Namn</span>
                      <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="T.ex. Bröllop 2026"
                        maxLength={50}
                        className="h-14 w-full rounded-lg border border-[#b0b0b0] px-4 font-body text-[16px] leading-5 text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
                      />
                    </label>
                    <p className="mt-2 font-body text-[12px] leading-4 text-[#6a6a6a]">
                      50 tecken som mest
                    </p>
                  </form>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-[#ebebeb] px-6 py-4">
                {showCreate ? (
                  <Button
                    type="submit"
                    form="wishlist-create-form"
                    variant="dark"
                    className="w-full rounded-lg text-base"
                    disabled={saving || !name.trim()}
                  >
                    {saving ? 'Skapar...' : 'Skapa'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="dark"
                    className="w-full rounded-lg text-base"
                    disabled={showSkeleton}
                    onClick={() => {
                      setName('')
                      setError(null)
                      setStep('create')
                    }}
                  >
                    Skapa ny önskelista
                  </Button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      <WishlistSavedToast
        data={toast}
        onDismiss={dismissToast}
        onChange={() => {
          dismissToast()
          onOpen()
        }}
      />
    </>
  )
}

function WishlistCover({ photos }: { photos: string[] }) {
  const src = photos[0]

  if (!src) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-[#f2f2f2] transition group-hover:brightness-95">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M16 28s-12-7.5-12-15a6.5 6.5 0 0 1 12-3.5A6.5 6.5 0 0 1 28 13c0 7.5-12 15-12 15z"
            stroke="#b0b0b0"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-[#ebebeb] shadow-[0_0_0_1px_rgba(0,0,0,0.04)] transition group-hover:brightness-95">
      <Image src={src} alt="" fill className="object-cover" sizes="240px" />
    </div>
  )
}
