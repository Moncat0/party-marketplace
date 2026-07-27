'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onClose: () => void
}

export default function ReadReceiptsLearnMore({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Stäng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="read-receipts-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="read-receipts-title" className="text-[22px] font-bold text-[#222222]">
            Läskvitton
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Stäng"
            className="h-8 w-8 text-[#6a6a6a]"
          >
            ✕
          </Button>
        </div>
        <div className="space-y-3 text-[14px] leading-[1.5] text-[#6a6a6a]">
          <p>
            När läskvitton är på ser den du chattar med när du har öppnat deras meddelanden
            (visas som &quot;Läst&quot; under meddelandet).
          </p>
          <p>
            Om du stänger av dem ser andra inte när du har läst. Du får fortfarande olästa
            meddelanden markerade som lästa i din egen inkorg.
          </p>
          <p>
            Inställningen gäller båda håll — om den andra personen har stängt av läskvitton
            ser du inte heller när hen har läst dina meddelanden.
          </p>
        </div>
        <Button type="button" onClick={onClose} className="mt-6 w-full">
          Jag förstår
        </Button>
      </div>
    </div>
  )
}
