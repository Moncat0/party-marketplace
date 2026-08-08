'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { settingsTokens as t } from '@/components/settings/tokens'
import { Button } from '@/components/ui/button'

export type InboxThread = {
  id: string
  name: string
  subtitle?: string | null
  lastText: string
  lastAt: string | null
  unread: number
}

type Props = {
  threads: InboxThread[]
  activeId?: string | null
  /** Base path for query-param selection on desktop, e.g. /planner/messages */
  inboxPath: string
  /** Mobile / full-page thread path; use `:id` placeholder, e.g. /booking/:id/messages */
  threadPath: string
  emptyTitle: string
  emptyDescription: string
  emptyCta?: { href: string; label: string }
  accent?: 'ember' | 'ink'
}

export default function MessagesInbox({
  threads,
  activeId,
  inboxPath,
  threadPath,
  emptyTitle,
  emptyDescription,
  emptyCta,
  accent = 'ember',
}: Props) {
  const router = useRouter()
  const avatarBg =
    accent === 'ember' ? 'rgba(255, 46, 138, 0.1)' : 'rgba(34, 34, 34, 0.08)'
  const avatarColor = accent === 'ember' ? t.colors.primary : t.colors.ink

  function hrefForThread(id: string) {
    return threadPath.replace(':id', id)
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] px-6 text-center">
        <p className="text-[16px] font-medium text-[#222222] mb-2">{emptyTitle}</p>
        <p className="text-[14px] text-[#6a6a6a] mb-6 max-w-sm">{emptyDescription}</p>
        {emptyCta && (
          <Button asChild size="lg" className="rounded-xl">
            <Link href={emptyCta.href}>{emptyCta.label}</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="divide-y h-full overflow-y-auto" style={{ borderColor: t.colors.hairlineSoft }}>
      {threads.map(thread => {
        const active = activeId === thread.id
        const hasUnread = thread.unread > 0
        return (
          <Button
            key={thread.id}
            type="button"
            variant="ghost"
            onClick={() => {
              // Mobile: full thread page. Desktop: query param split.
              if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
                router.push(`${inboxPath}?c=${thread.id}`, { scroll: false })
              } else {
                router.push(hrefForThread(thread.id))
              }
            }}
            className="h-auto w-full justify-start gap-3 rounded-none px-4 py-4 text-left"
            style={{
              backgroundColor: active ? t.colors.surfaceSoft : 'transparent',
              borderColor: t.colors.hairlineSoft,
            }}
          >
            <div
              className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              <span className="text-sm font-bold" style={{ color: avatarColor }}>
                {thread.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p
                  className={`text-[14px] truncate ${
                    hasUnread ? 'font-semibold text-[#222222]' : 'font-medium text-[#222222]'
                  }`}
                >
                  {thread.name}
                </p>
                {thread.lastAt && (
                  <p className="text-[12px] text-[#6a6a6a] flex-shrink-0">
                    {new Date(thread.lastAt).toLocaleDateString('sv-SE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
              <p
                className={`text-[14px] truncate ${
                  hasUnread ? 'text-[#222222]' : 'text-[#6a6a6a]'
                }`}
              >
                {thread.lastText}
              </p>
              {thread.subtitle && (
                <p className="text-[12px] text-[#929292] truncate mt-0.5">{thread.subtitle}</p>
              )}
            </div>
            {hasUnread && (
              <span className="h-5 w-5 rounded-full bg-[#FF2E8A] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                {thread.unread}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
