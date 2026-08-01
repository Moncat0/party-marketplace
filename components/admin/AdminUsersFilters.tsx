'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS = [
  { value: '', label: 'Alla typer' },
  { value: 'planner', label: 'Planerare' },
  { value: 'provider', label: 'Talang' },
  { value: 'both', label: 'Båda' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Alla status' },
  { value: 'active', label: 'Aktiva' },
  { value: 'deactivated', label: 'Inaktiverade' },
]

const AUTH_OPTIONS = [
  { value: '', label: 'Alla inloggningar' },
  { value: 'google', label: 'Google' },
  { value: 'email', label: 'E-post' },
  { value: 'apple', label: 'Apple' },
  { value: 'facebook', label: 'Facebook' },
]

const selectClass =
  'h-10 rounded-xl border border-border bg-background px-3 text-[13px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function AdminUsersFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [auth, setAuth] = useState(searchParams.get('auth') ?? '')

  function apply(next: {
    q?: string
    type?: string
    status?: string
    auth?: string
  }) {
    const params = new URLSearchParams()
    const nq = next.q ?? q
    const ntype = next.type ?? type
    const nstatus = next.status ?? status
    const nauth = next.auth ?? auth
    if (nq.trim()) params.set('q', nq.trim())
    if (ntype) params.set('type', ntype)
    if (nstatus) params.set('status', nstatus)
    if (nauth) params.set('auth', nauth)
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    apply({ q })
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-background p-4',
        pending && 'opacity-70'
      )}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
          aria-hidden
        />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Sök namn eller e-post…"
          className="h-10 rounded-xl pl-9"
          aria-label="Sök användare"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className={selectClass}
          value={type}
          onChange={e => {
            setType(e.target.value)
            apply({ type: e.target.value })
          }}
          aria-label="Filtrera typ"
        >
          {TYPE_OPTIONS.map(o => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={status}
          onChange={e => {
            setStatus(e.target.value)
            apply({ status: e.target.value })
          }}
          aria-label="Filtrera status"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={auth}
          onChange={e => {
            setAuth(e.target.value)
            apply({ auth: e.target.value })
          }}
          aria-label="Filtrera inloggning"
        >
          {AUTH_OPTIONS.map(o => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" className="h-10 rounded-xl px-4">
          Sök
        </Button>
      </div>
    </form>
  )
}
