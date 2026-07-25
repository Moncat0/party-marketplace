'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { track } from '@/lib/posthog'
import {
  addToWishlist,
  createWishlist,
  fetchUserWishlists,
  type WishlistSummary,
} from '@/lib/wishlists'

type Props = {
  open: boolean
  onClose: () => void
  providerId: string
  plannerId: string
  onSaved: () => void
}

type Step = 'pick' | 'create'

/**
 * Live Airbnb “Save to wishlist” modal (audited Jul 2026):
 * - Title centered, close (X) top-right
 * - 2-col cover grid in scrollable body
 * - Sticky footer: full-width black “Create new wishlist”
 * - Create step: name field + Create CTA; back chevron top-left
 */
export default function WishlistSaveModal({
  open,
  onClose,
  providerId,
  plannerId,
  onSaved,
}: Props) {
  const [step, setStep] = useState<Step>('pick')
  const [lists, setLists] = useState<WishlistSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setName('')
    setSaving(false)
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchUserWishlists(plannerId)
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
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  async function handleSelect(listId: string) {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await addToWishlist(listId, providerId)
      track('shortlist_item_saved', {
        provider_id: providerId,
        planner_id: plannerId,
        shortlist_id: listId,
      })
      onSaved()
      onClose()
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
      onSaved()
      onClose()
    } catch {
      setError('Kunde inte skapa listan. Försök igen.')
      setSaving(false)
    }
  }

  // Portal to body so carousel transform/overflow can't clip the dialog.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
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

      <div className="relative flex flex-col w-full sm:max-w-[568px] max-h-[90vh] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] rounded-t-3xl sm:rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="relative flex-shrink-0 px-6 pt-6 pb-4">
          {step === 'create' && lists.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setStep('pick')
                setError(null)
              }}
              className="absolute left-4 top-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7]"
              aria-label="Tillbaka"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M10 3L5 8l5 5"
                  stroke="#222"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7]"
              aria-label="Stäng"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <h2
            id="wishlist-modal-title"
            className="text-center text-[16px] leading-5 font-semibold text-[#222222] font-body"
          >
            {step === 'create' ? 'Namnge den här önskelistan' : 'Spara i en önskelista'}
          </h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {error && (
            <p className="text-[14px] leading-[18px] text-[#c13515] mb-4">{error}</p>
          )}

          {step === 'pick' && (
            <>
              {loading ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-4">
                  {[0, 1].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square rounded-2xl bg-[#ebebeb]" />
                      <div className="h-3.5 w-2/3 mt-2 rounded bg-[#ebebeb]" />
                      <div className="h-3.5 w-1/3 mt-1.5 rounded bg-[#ebebeb]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-4">
                  {lists.map(list => (
                    <button
                      key={list.id}
                      type="button"
                      disabled={saving}
                      onClick={() => handleSelect(list.id)}
                      className="text-left group disabled:opacity-60 min-w-0"
                    >
                      <WishlistCover photos={list.cover_photos} />
                      <p className="mt-2 text-[14px] leading-[18px] font-medium text-[#222222] truncate font-body">
                        {list.name}
                      </p>
                      <p className="text-[14px] leading-[18px] text-[#6a6a6a] font-body">
                        {list.item_count === 0
                          ? 'Tom'
                          : `${list.item_count} ${list.item_count === 1 ? 'sparad' : 'sparade'}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'create' && (
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
                  className="w-full h-14 px-4 text-[16px] leading-5 text-[#222222] placeholder-[#717171] border border-[#b0b0b0] rounded-lg focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] font-body"
                />
              </label>
              <p className="mt-2 text-[12px] leading-4 text-[#6a6a6a] font-body">
                50 tecken som mest
              </p>
            </form>
          )}
        </div>

        {/* Footer — live Airbnb: create CTA lives here on the pick step */}
        <div className="flex-shrink-0 border-t border-[#ebebeb] px-6 py-4">
          {step === 'pick' ? (
            <button
              type="button"
              onClick={() => {
                setName('')
                setError(null)
                setStep('create')
              }}
              className="w-full h-12 text-[16px] leading-5 font-medium text-white bg-[#222222] hover:bg-black rounded-lg transition-colors font-body"
            >
              Skapa ny önskelista
            </button>
          ) : (
            <button
              type="submit"
              form="wishlist-create-form"
              disabled={saving || !name.trim()}
              className="w-full h-12 text-[16px] leading-5 font-medium text-white bg-[#222222] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors font-body"
            >
              {saving ? 'Skapar...' : 'Skapa'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Live Airbnb save-modal covers use a single photo with ~16–20px radius. */
function WishlistCover({ photos }: { photos: string[] }) {
  const src = photos[0]

  if (!src) {
    return (
      <div className="aspect-square rounded-2xl bg-[#f2f2f2] flex items-center justify-center group-hover:brightness-95 transition">
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
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#ebebeb] group-hover:brightness-95 transition shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <Image src={src} alt="" fill className="object-cover" sizes="240px" />
    </div>
  )
}
