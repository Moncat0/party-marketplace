'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { openAuth } from '@/lib/open-auth'

const REASONS = [
  'Felaktig information',
  'Olämpligt innehåll',
  'Bedrägeri eller spam',
  'Upphovsrättsintrång',
  'Annat',
]

type Props = {
  serviceId: string
  isLoggedIn: boolean
}

export default function ReportServiceButton({ serviceId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!isLoggedIn) {
      openAuth()
      return
    }
    setDone(false)
    setError(null)
    setReason(REASONS[0])
    setDetails('')
    setOpen(true)
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'service',
          target_id: serviceId,
          reason,
          details: details.trim() || undefined,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Något gick fel')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        <Flag className="size-3.5" strokeWidth={2} aria-hidden />
        Anmäl tjänsten
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Anmäl tjänsten</DialogTitle>
            <DialogDescription>
              Vi granskar alla anmälningar och vidtar åtgärder om vi hittar
              regelbrott.
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <p className="py-2 text-[14px] text-[#1D9E75]">
              Tack — vi har tagit emot din anmälan.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-reason">Anledning</Label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="report-details">
                  Detaljer{' '}
                  <span className="font-normal text-muted-foreground">
                    (valfritt)
                  </span>
                </Label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Berätta mer om vad du sett…"
                />
              </div>
              {error ? (
                <p className="text-[13px] text-destructive">{error}</p>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              {done ? 'Stäng' : 'Avbryt'}
            </Button>
            {!done ? (
              <Button
                type="button"
                className="rounded-xl"
                disabled={busy}
                onClick={() => void submit()}
              >
                {busy ? 'Skickar…' : 'Skicka anmälan'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
