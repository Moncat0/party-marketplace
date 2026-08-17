'use client'

import { useState } from 'react'
import { Mail, Ban, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type Props = {
  userId: string
  email: string
  name: string
  deactivated: boolean
}

export default function AdminUserActions({
  userId,
  email,
  name,
  deactivated,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messageOpen, setMessageOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [subject, setSubject] = useState('Meddelande från Gigtorget')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  async function deactivate(reactivate: boolean) {
    setBusy(reactivate ? 'reactivate' : 'deactivate')
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactivate }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Något gick fel')
      // Hard reload so the badge/status is never stale
      window.location.assign(`/admin/users/${userId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
      setBusy(null)
    }
  }

  async function sendMessage() {
    setBusy('message')
    setError(null)
    setSent(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: body }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte skicka')
      setSent(true)
      setBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte skicka')
    } finally {
      setBusy(null)
    }
  }

  async function deleteUser() {
    setBusy('delete')
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Kunde inte radera')
      setDeleteOpen(false)
      // Soft navigation left us on a stale detail page; force a full load.
      window.location.assign('/admin/users')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte radera')
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setSent(false)
            setMessageOpen(true)
          }}
        >
          <Mail className="size-4" data-icon="inline-start" />
          Skicka meddelande
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={`mailto:${encodeURIComponent(email)}`}>Öppna e-post</a>
        </Button>
        {deactivated ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={busy !== null}
            onClick={() => void deactivate(true)}
          >
            <RotateCcw className="size-4" data-icon="inline-start" />
            {busy === 'reactivate' ? 'Aktiverar…' : 'Återaktivera'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={busy !== null}
            onClick={() => void deactivate(false)}
          >
            <Ban className="size-4" data-icon="inline-start" />
            {busy === 'deactivate' ? 'Inaktiverar…' : 'Inaktivera'}
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          className="rounded-xl"
          disabled={busy !== null}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" data-icon="inline-start" />
          Radera
        </Button>
      </div>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meddela {name}</DialogTitle>
            <DialogDescription>
              Skickas som e-post från Gigtorget support. Svar går till din admin-adress.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="admin-msg-subject">Ämne</Label>
              <Input
                id="admin-msg-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="admin-msg-body">Meddelande</Label>
              <textarea
                id="admin-msg-body"
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Hej! Vi hör av oss från Gigtorget…"
              />
            </div>
            {sent ? (
              <p className="text-[13px] text-[#1D9E75]">Meddelandet skickades.</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setMessageOpen(false)}
            >
              Stäng
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={busy === 'message' || !subject.trim() || !body.trim()}
              onClick={() => void sendMessage()}
            >
              {busy === 'message' ? 'Skickar…' : 'Skicka'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Radera {name}?</DialogTitle>
            <DialogDescription>
              Permanent. Bokningar, meddelanden och tjänster kopplade till kontot tas bort.
              Detta går inte att ångra.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteOpen(false)}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={busy === 'delete'}
              onClick={() => void deleteUser()}
            >
              {busy === 'delete' ? 'Raderar…' : 'Ja, radera permanent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
