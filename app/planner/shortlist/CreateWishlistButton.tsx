'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWishlist } from '@/lib/wishlists'

type Props = {
  plannerId: string
  variant?: 'icon' | 'primary' | 'card'
}

export default function CreateWishlistButton({ plannerId, variant = 'icon' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const list = await createWishlist(plannerId, name.trim())
      setOpen(false)
      setName('')
      router.push(`/planner/shortlist/${list.id}`)
      router.refresh()
    } catch {
      setError('Kunde inte skapa listan. Försök igen.')
      setSaving(false)
    }
  }

  return (
    <>
      {variant === 'card' ? (
        <button type="button" onClick={() => setOpen(true)} className="group block w-full text-left min-w-0">
          <div
            className="aspect-square bg-[#f2f2f2] flex items-center justify-center transition group-hover:brightness-[0.97]"
            style={{ borderRadius: 16 }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path d="M16 8v16M8 16h16" stroke="#222" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-3 text-[15px] font-semibold text-[#222222] leading-5">
            Skapa ny önskelista
          </p>
        </button>
      ) : variant === 'primary' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 items-center justify-center px-6 text-[16px] font-semibold text-white bg-[#222222] hover:bg-black rounded-lg transition-colors"
        >
          Skapa en önskelista
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 px-4 text-[14px] font-semibold text-[#222222] border border-[#222222] hover:bg-[#f7f7f7] rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Skapa
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Stäng"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-[568px] bg-white shadow-2xl sm:mx-4 rounded-t-3xl sm:rounded-2xl">
            <div className="relative border-b border-[#ebebeb] px-4 py-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7]"
                aria-label="Stäng"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M1 1l12 12M13 1L1 13" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <h2 className="text-[16px] font-semibold text-[#222222]">
                Namnge den här önskelistan
              </h2>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-6">
              {error && <p className="text-[14px] text-[#c13515] mb-4">{error}</p>}
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="T.ex. Bröllop 2026"
                maxLength={50}
                className="w-full h-14 px-4 text-[16px] text-[#222222] placeholder-[#717171] border border-[#b0b0b0] rounded-lg focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
              />
              <p className="mt-2 text-[12px] text-[#6a6a6a]">50 tecken som mest</p>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="mt-6 w-full h-12 text-[16px] font-semibold text-white bg-[#222222] hover:bg-black disabled:opacity-40 rounded-lg transition-colors"
              >
                {saving ? 'Skapar...' : 'Skapa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
