'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import MessagesInbox, { type InboxThread } from '@/components/MessagesInbox'
import SettingsToggle from '@/components/settings/SettingsToggle'
import SettingsButton from '@/components/settings/SettingsButton'
import SettingsInput from '@/components/settings/SettingsInput'
import { settingsTokens as t } from '@/components/settings/tokens'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  loadArchivedIds,
  loadQuickReplies,
  loadSuggestedRepliesEnabled,
  newQuickReply,
  saveQuickReplies,
  setSuggestedRepliesEnabled,
  setThreadArchived,
  type QuickReply,
} from '@/lib/messaging-prefs'

type Filter = 'all' | 'unread' | 'archived'

type Props = {
  userId: string
  threads: InboxThread[]
  activeId?: string | null
  inboxPath: string
  threadPath: string
  accent?: 'ember' | 'ink'
  /** Center pane (desktop) — conversation or empty */
  conversation?: ReactNode
  /** Right pane (desktop) — booking details when a thread is active */
  details?: ReactNode
  /** Subtract from viewport for shell chrome (default guest header ~80px). Ignored when fillParent. */
  headerOffsetPx?: number
  /** Fill parent height instead of calc(100vh - offset) — use inside DashboardShell flush */
  fillParent?: boolean
}

type Modal =
  | null
  | 'settings'
  | 'quick_replies'
  | 'suggested'
  | 'feedback'
  | 'search'

export default function MessagesPanel({
  userId,
  threads,
  activeId,
  inboxPath,
  threadPath,
  accent = 'ember',
  conversation,
  details,
  headerOffsetPx = 80,
  fillParent = false,
}: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [allMenuOpen, setAllMenuOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [search, setSearch] = useState('')
  const [archivedIds, setArchivedIds] = useState<string[]>([])
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [suggestedOn, setSuggestedOn] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [arch, qr, sug] = await Promise.all([
        loadArchivedIds(userId),
        loadQuickReplies(userId),
        loadSuggestedRepliesEnabled(userId),
      ])
      if (cancelled) return
      setArchivedIds(arch)
      setReplies(qr)
      setSuggestedOn(sug)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const visible = useMemo(() => {
    let list = threads
    const archived = new Set(archivedIds)
    if (filter === 'archived') {
      list = list.filter(th => archived.has(th.id))
    } else {
      list = list.filter(th => !archived.has(th.id))
      if (filter === 'unread') list = list.filter(th => th.unread > 0)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        th =>
          th.name.toLowerCase().includes(q) ||
          th.lastText.toLowerCase().includes(q) ||
          (th.subtitle?.toLowerCase().includes(q) ?? false)
      )
    }
    return list
  }, [threads, archivedIds, filter, search])

  async function archiveActive() {
    if (!activeId) return
    const next = await setThreadArchived(userId, activeId, true)
    setArchivedIds(next)
    router.push(inboxPath)
  }

  async function unarchive(id: string) {
    const next = await setThreadArchived(userId, id, false)
    setArchivedIds(next)
  }

  async function persistReplies(next: QuickReply[]) {
    setReplies(next)
    await saveQuickReplies(userId, next)
  }

  async function toggleSuggested(value: boolean) {
    setSuggestedOn(value)
    await setSuggestedRepliesEnabled(userId, value)
  }

  async function sendFeedback() {
    if (!feedback.trim()) return
    setFeedbackSaving(true)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: feedback.trim() }),
    })
    setFeedbackSaving(false)
    if (res.ok) {
      setFeedbackSent(true)
      setFeedback('')
    }
  }

  const emptyTitle =
    filter === 'archived'
      ? 'Inga arkiverade meddelanden'
      : filter === 'unread'
        ? 'Inga olästa meddelanden'
        : 'Du har inga meddelanden'
  const emptyDescription =
    filter === 'archived'
      ? 'När du arkiverar en konversation dyker den upp här.'
      : filter === 'unread'
        ? 'När du får nya meddelanden syns de här.'
        : 'När du får ett nytt meddelande visas det här.'

  const sidebar = (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Title row — Airbnb: large bold title + circular icon buttons */}
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-[32px] leading-none font-bold tracking-[-0.6px] text-[#222222]">
          Meddelanden
        </h1>
        <div className="flex items-center gap-2.5">
          <IconButton
            label="Sök"
            onClick={() => {
              setModal('search')
              setSearch('')
            }}
          >
            <SearchIcon />
          </IconButton>
          <IconButton label="Inställningar" onClick={() => setModal('settings')}>
            <GearIcon />
          </IconButton>
        </div>
      </div>

      {/* Filters — All (dropdown: All / Archived) + Unread */}
      <div className="flex items-center gap-3 px-6 pb-2 flex-shrink-0 relative">
        <div className="relative">
          <Button
            type="button"
            variant={filter === 'all' || filter === 'archived' ? 'dark' : 'outline'}
            size="pill"
            aria-expanded={allMenuOpen}
            onClick={() => {
              if (filter === 'unread') {
                setFilter('all')
                setAllMenuOpen(false)
                return
              }
              setAllMenuOpen(v => !v)
            }}
            className="h-10 gap-1.5 px-[18px] text-[14px]"
          >
            {filter === 'archived' ? 'Arkiverade' : 'Alla'}
            <ChevronIcon />
          </Button>
          {allMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Stäng"
                onClick={() => setAllMenuOpen(false)}
              />
              <div
                className="absolute left-0 top-12 z-20 w-[220px] bg-white py-2 shadow-[0_6px_20px_rgba(0,0,0,0.14)]"
                style={{ borderRadius: 12, border: `1px solid ${t.colors.hairline}` }}
              >
                <MenuItem
                  label="Alla"
                  active={filter === 'all'}
                  onClick={() => {
                    setFilter('all')
                    setAllMenuOpen(false)
                  }}
                />
                <MenuItem
                  label="Arkiverade"
                  active={filter === 'archived'}
                  onClick={() => {
                    setFilter('archived')
                    setAllMenuOpen(false)
                  }}
                />
              </div>
            </>
          )}
        </div>
        <Button
          type="button"
          variant={filter === 'unread' ? 'dark' : 'outline'}
          size="pill"
          onClick={() => {
            setFilter(prev => (prev === 'unread' ? 'all' : 'unread'))
            setAllMenuOpen(false)
          }}
          className="h-10 px-[18px] text-[14px]"
        >
          Olästa
        </Button>
        {activeId && filter !== 'archived' && (
          <Button
            type="button"
            variant="link"
            onClick={archiveActive}
            className="ml-auto h-auto p-0 text-[13px] text-muted-foreground hover:text-foreground"
          >
            Arkivera
          </Button>
        )}
        {filter === 'archived' && activeId && (
          <Button
            type="button"
            variant="link"
            onClick={() => unarchive(activeId)}
            className="ml-auto h-auto p-0 text-[13px] text-muted-foreground hover:text-foreground"
          >
            Återställ
          </Button>
        )}
      </div>

      {modal === 'search' && (
        <div className="px-6 pt-3 pb-2 flex-shrink-0">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök meddelanden"
            className="w-full h-12 px-4 text-[14px] text-[#222222] placeholder:text-[#717171] focus:outline-none"
            style={{
              borderRadius: 9999,
              border: '1px solid #b0b0b0',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      )}

      {/* List / empty — vertically centered like Airbnb when empty */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {visible.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <MessagesInbox
            threads={visible}
            activeId={activeId}
            inboxPath={inboxPath}
            threadPath={threadPath}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            accent={accent}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <div
        className={`lg:hidden flex flex-col ${fillParent ? 'h-full min-h-0' : 'min-h-[calc(100dvh-5rem)]'}`}
      >
        {sidebar}
      </div>

      {/* Desktop: inbox | chat | booking details (Airbnb Messages) */}
      <div
        className={cn(
          'hidden w-full min-h-0 overflow-hidden bg-white lg:grid',
          details && activeId
            ? 'lg:grid-cols-[320px_minmax(0,1fr)_minmax(300px,340px)]'
            : 'lg:grid-cols-[375px_minmax(0,1fr)]'
        )}
        style={{
          height: fillParent ? '100%' : `calc(100vh - ${headerOffsetPx}px)`,
        }}
      >
        <aside className="h-full min-h-0 overflow-hidden border-r border-[#ebebeb]">
          {sidebar}
        </aside>
        <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
          {conversation ? (
            <div className="h-full min-h-0 overflow-hidden">{conversation}</div>
          ) : (
            <div className="flex-1 bg-white" />
          )}
        </section>
        {details && activeId ? (
          <div className="h-full min-h-0 overflow-hidden">{details}</div>
        ) : null}
      </div>

      {/* Settings modal */}
      {modal === 'settings' && (
        <ModalShell title="Meddelandeinställningar" onClose={() => setModal(null)}>
          <SettingsRow
            icon={<BubbleIcon />}
            label="Hantera snabb­svar"
            onClick={() => setModal('quick_replies')}
          />
          <SettingsRow
            icon={<SparkleIcon />}
            label="Föreslagna svar"
            onClick={() => setModal('suggested')}
          />
          <SettingsRow
            icon={<ArchiveIcon />}
            label="Arkiverade"
            onClick={() => {
              setFilter('archived')
              setModal(null)
            }}
          />
          <SettingsRow
            icon={<FeedbackIcon />}
            label="Ge feedback"
            onClick={() => {
              setFeedbackSent(false)
              setModal('feedback')
            }}
          />
        </ModalShell>
      )}

      {modal === 'quick_replies' && (
        <ModalShell title="Snabb­svar" onClose={() => setModal('settings')} wide>
          <p className="text-[14px] text-[#6a6a6a] mb-5">
            Spara fraser du använder ofta och skicka dem med ett klick i chatten.
          </p>
          <div className="space-y-3 mb-5">
            {replies.map(r => (
              <div
                key={r.id}
                className="p-4"
                style={{ borderRadius: t.rounded.md, border: `1px solid ${t.colors.hairline}` }}
              >
                {editingReply?.id === r.id ? (
                  <div className="space-y-3">
                    <SettingsInput
                      id="qr-title"
                      label="Titel"
                      value={editingReply.title}
                      onChange={v => setEditingReply({ ...editingReply, title: v })}
                    />
                    <label className="block text-[14px] font-medium text-[#6a6a6a] mb-2">Text</label>
                    <textarea
                      value={editingReply.body}
                      onChange={e => setEditingReply({ ...editingReply, body: e.target.value })}
                      rows={3}
                      className="w-full text-[16px] text-[#222222] focus:outline-none resize-none"
                      style={{
                        padding: '14px 12px',
                        borderRadius: t.rounded.sm,
                        border: `1px solid ${t.colors.hairline}`,
                      }}
                    />
                    <div className="flex gap-2">
                      <SettingsButton
                        size="sm"
                        onClick={async () => {
                          if (!editingReply.title.trim() || !editingReply.body.trim()) return
                          await persistReplies(
                            replies.map(x => (x.id === editingReply.id ? editingReply : x))
                          )
                          setEditingReply(null)
                        }}
                      >
                        Spara
                      </SettingsButton>
                      <SettingsButton size="sm" variant="secondary" onClick={() => setEditingReply(null)}>
                        Avbryt
                      </SettingsButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#222222]">{r.title}</p>
                      <p className="text-[14px] text-[#6a6a6a] mt-1 line-clamp-2">{r.body}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-[13px]"
                        onClick={() => setEditingReply(r)}
                      >
                        Redigera
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-[13px] text-destructive"
                        onClick={() => persistReplies(replies.filter(x => x.id !== r.id))}
                      >
                        Ta bort
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <SettingsButton
            variant="secondary"
            onClick={() => {
              const created = newQuickReply({ title: 'Nytt svar', body: '' })
              setEditingReply(created)
              setReplies(prev => [...prev, created])
            }}
          >
            + Lägg till snabb­svar
          </SettingsButton>
        </ModalShell>
      )}

      {modal === 'suggested' && (
        <ModalShell title="Föreslagna svar" onClose={() => setModal('settings')}>
          <SettingsToggle
            label="Visa föreslagna svar"
            description="När det är på kan du snabbt välja bland dina snabb­svar ovanför skrivfältet."
            checked={suggestedOn}
            onChange={toggleSuggested}
          />
        </ModalShell>
      )}

      {modal === 'feedback' && (
        <ModalShell title="Ge feedback" onClose={() => setModal('settings')}>
          {feedbackSent ? (
            <p className="text-[14px] text-[#1D9E75]">Tack! Din feedback är skickad.</p>
          ) : (
            <>
              <p className="text-[14px] text-[#6a6a6a] mb-4">
                Berätta hur meddelanden fungerar för dig — vad saknas, vad kan bli bättre?
              </p>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={5}
                placeholder="Din feedback..."
                className="w-full text-[16px] text-[#222222] focus:outline-none resize-none mb-4"
                style={{
                  padding: '14px 12px',
                  borderRadius: t.rounded.sm,
                  border: `1px solid ${t.colors.hairline}`,
                }}
              />
              <SettingsButton onClick={sendFeedback} disabled={feedbackSaving || feedback.trim().length < 3}>
                {feedbackSaving ? 'Skickar...' : 'Skicka feedback'}
              </SettingsButton>
            </>
          )}
        </ModalShell>
      )}
    </>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
      <div className="mb-6 text-[#222222]">
        <EmptyBubbles />
      </div>
      <p className="text-[16px] font-semibold text-[#222222] mb-1.5 tracking-[-0.1px]">{title}</p>
      <p className="text-[14px] text-[#6a6a6a] max-w-[240px] leading-[1.4]">{description}</p>
    </div>
  )
}

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Stäng" onClick={onClose} />
      <div
        className={`relative w-full bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'} rounded-t-2xl sm:rounded-2xl max-h-[min(92dvh,100%)] overflow-auto pb-[env(safe-area-inset-bottom)] sm:pb-0`}
        style={{ maxHeight: 'min(92dvh, 100%)' }}
      >
        <div className="sticky top-0 bg-white flex items-center justify-center px-4 py-4 border-b border-[#ebebeb]">
          <h2 className="text-[16px] font-semibold text-[#222222]">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2"
            aria-label="Stäng"
          >
            ✕
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full justify-start gap-4 py-4 text-left -mx-2 px-2 rounded-lg"
    >
      <span className="text-foreground">{icon}</span>
      <span className="text-[16px] font-medium text-foreground flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </Button>
  )
}

function MenuItem({
  label,
  onClick,
  active,
}: {
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto w-full justify-between gap-2 rounded-none px-4 py-2.5 text-left text-[14px] font-medium text-foreground'
      )}
    >
      <span>{label}</span>
      {active && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </Button>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="bg-accent text-foreground hover:bg-accent/80"
    >
      {children}
    </Button>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function BubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  )
}
function ArchiveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  )
}
function FeedbackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
function EmptyBubbles() {
  // Airbnb-style: two overlapping speech bubbles, front one with dots
  return (
    <svg width="64" height="52" viewBox="0 0 64 52" fill="none" aria-hidden>
      <path
        d="M38 6h16c5.523 0 10 4.477 10 10v8c0 5.523-4.477 10-10 10h-2.5L46 42l-4.5-8H38c-5.523 0-10-4.477-10-10v-8c0-5.523 4.477-10 10-10z"
        stroke="#222222"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 2h22c5.523 0 10 4.477 10 10v10c0 5.523-4.477 10-10 10H18l-6 8v-8H10C4.477 32 0 27.523 0 22V12C0 6.477 4.477 2 10 2z"
        stroke="#222222"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="white"
      />
      <circle cx="14" cy="17" r="1.75" fill="#222222" />
      <circle cx="21" cy="17" r="1.75" fill="#222222" />
      <circle cx="28" cy="17" r="1.75" fill="#222222" />
    </svg>
  )
}
