'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/posthog'
import { deleteWishlist, renameWishlist } from '@/lib/wishlists'

type Props = {
  open: boolean
  onClose: () => void
  shortlistId: string
  name: string
  shareToken: string
  itemCount: number
  onRenamed: (name: string) => void
}

type Step = 'menu' | 'rename' | 'delete' | 'link'

export default function WishlistSettingsModal({
  open,
  onClose,
  shortlistId,
  name,
  shareToken,
  itemCount,
  onRenamed,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('menu')
  const [renameValue, setRenameValue] = useState(name)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('menu')
    setRenameValue(name)
    setBusy(false)
    setCopied(false)
    setError(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, name, onClose])

  if (!open) return null

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/shortlist/${shareToken}`
      : `/shortlist/${shareToken}`

  async function handleShare() {
    track('shortlist_shared', { shortlist_id: shortlistId, item_count: itemCount })
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} på FESTEN.`, url: shareUrl })
        onClose()
        return
      } catch {
        // fall through
      }
    }
    setStep('link')
  }

  async function handleCopyLink() {
    track('shortlist_shared', { shortlist_id: shortlistId, item_count: itemCount })
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Kunde inte kopiera länken.')
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameValue.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await renameWishlist(shortlistId, renameValue.trim())
      onRenamed(renameValue.trim())
      onClose()
    } catch {
      setError('Kunde inte byta namn.')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await deleteWishlist(shortlistId)
      router.push('/planner/shortlist')
      router.refresh()
    } catch {
      setError('Kunde inte ta bort listan.')
      setBusy(false)
    }
  }

  const title =
    step === 'rename'
      ? 'Byt namn'
      : step === 'delete'
        ? 'Ta bort önskelista'
        : step === 'link'
          ? 'Skrivskyddad länk'
          : 'Inställningar'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Stäng" onClick={onClose} />
      <div className="relative w-full sm:max-w-[400px] bg-white shadow-2xl sm:mx-4 rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <div className="relative border-b border-[#ebebeb] px-4 py-4 flex items-center justify-center">
          {step !== 'menu' ? (
            <button
              type="button"
              onClick={() => setStep('menu')}
              className="absolute left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7]"
              aria-label="Tillbaka"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7]"
              aria-label="Stäng"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <h2 className="text-[16px] font-semibold text-[#222222]">{title}</h2>
        </div>

        <div className="px-2 py-2">
          {error && <p className="px-4 py-2 text-[14px] text-[#c13515]">{error}</p>}

          {step === 'menu' && (
            <ul>
              <MenuRow
                icon={
                  <path
                    d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9M16 4v18M8 11l8-8 8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                }
                label="Dela önskelista"
                onClick={handleShare}
              />
              <MenuRow
                icon={
                  <>
                    <path
                      d="M16 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8S2 16 2 16z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </>
                }
                label="Skicka som skrivskyddad länk"
                onClick={() => setStep('link')}
              />
              <MenuRow
                icon={
                  <path
                    d="M22.5 5.5l4 4L11 25H7v-4L22.5 5.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                }
                label="Byt namn"
                onClick={() => setStep('rename')}
              />
              <MenuRow
                icon={
                  <>
                    <path d="M6 10h20M12 10V7h8v3M10 14v10M16 14v10M22 14v10M8 10l1.5 16h13L24 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                }
                label="Ta bort"
                onClick={() => setStep('delete')}
                danger
              />
            </ul>
          )}

          {step === 'rename' && (
            <form onSubmit={handleRename} className="px-4 py-4">
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                maxLength={50}
                className="w-full h-14 px-4 text-[16px] border border-[#b0b0b0] rounded-lg focus:outline-none focus:border-[#222] focus:ring-1 focus:ring-[#222]"
              />
              <button
                type="submit"
                disabled={busy || !renameValue.trim()}
                className="mt-4 w-full h-12 text-[16px] font-semibold text-white bg-[#222] rounded-lg disabled:opacity-40"
              >
                {busy ? 'Sparar...' : 'Spara'}
              </button>
            </form>
          )}

          {step === 'delete' && (
            <div className="px-4 py-4">
              <p className="text-[14px] text-[#6a6a6a] mb-6">
                Är du säker på att du vill ta bort <span className="font-semibold text-[#222]">{name}</span>?
                Det går inte att ångra.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="w-full h-12 text-[16px] font-semibold text-white bg-[#c13515] rounded-lg disabled:opacity-40"
              >
                {busy ? 'Tar bort...' : 'Ta bort'}
              </button>
            </div>
          )}

          {step === 'link' && (
            <div className="px-4 py-4">
              <p className="text-[14px] text-[#6a6a6a] mb-3">
                Alla med länken kan se listan, men inte redigera den.
              </p>
              <input
                readOnly
                value={shareUrl}
                onFocus={e => e.target.select()}
                className="w-full h-12 px-3 text-[13px] border border-[#ddd] rounded-lg bg-[#f7f7f7] text-[#222]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-4 w-full h-12 text-[16px] font-semibold text-white bg-[#222] rounded-lg"
              >
                {copied ? 'Kopierad!' : 'Kopiera länk'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-[#f7f7f7] text-left"
      >
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden className={danger ? 'text-[#c13515]' : 'text-[#222]'}>
          {icon}
        </svg>
        <span className={`flex-1 text-[16px] ${danger ? 'text-[#c13515]' : 'text-[#222]'}`}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="text-[#717171]">
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  )
}
