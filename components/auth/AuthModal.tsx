'use client'

import type { AuthIntent } from '@/lib/auth-intent'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import AuthPanel from '@/components/auth/AuthPanel'
import type { OpenAuthView } from '@/lib/open-auth'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  intent?: AuthIntent | null
  next?: string | null
  initialMode?: 'login' | 'signup'
  initialView?: OpenAuthView | null
}

export default function AuthModal({
  open,
  onOpenChange,
  intent = null,
  next = null,
  initialView = null,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="top-4 max-h-[calc(100dvh-2rem)] max-w-[440px] translate-y-0 gap-0 overflow-y-auto rounded-3xl border-0 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.28)] sm:top-[50%] sm:max-h-[calc(100dvh-2rem)] sm:translate-y-[-50%] sm:rounded-3xl sm:p-6"
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
          key={`${intent ?? ''}-${next ?? ''}-${initialView ?? ''}-${open}`}
          intent={intent}
          next={next}
          initialView={initialView ?? undefined}
          showClose
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
