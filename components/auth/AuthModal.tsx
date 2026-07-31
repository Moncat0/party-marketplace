'use client'

import type { AuthIntent } from '@/lib/auth-intent'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import AuthPanel from '@/components/auth/AuthPanel'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  intent?: AuthIntent | null
  next?: string | null
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({
  open,
  onOpenChange,
  intent = null,
  next = null,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-h-[min(96dvh,820px)] max-w-[440px] gap-0 overflow-y-auto rounded-3xl border-0 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.28)] sm:rounded-3xl sm:p-8"
        onOpenAutoFocus={e => {
          e.preventDefault()
          const root = e.currentTarget as HTMLElement | null
          root?.querySelector<HTMLElement>('input, button')?.focus()
        }}
      >
        <DialogTitle className="sr-only">Logga in eller skapa konto</DialogTitle>
        <DialogDescription className="sr-only">
          Fortsätt med e-post eller Google.
        </DialogDescription>
        <AuthPanel
          key={`${intent ?? ''}-${next ?? ''}-${open}`}
          intent={intent}
          next={next}
          showClose
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
