import type { ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

const ITEMS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: 'Varför syns inte all info här?',
    body: 'Vi döljer vissa kontouppgifter för att skydda din identitet.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden>
        <path
          d="M20 6l12 5v9c0 7.5-5.2 12.8-12 14.5C13.2 32.8 8 27.5 8 20V11l12-5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <rect x="16" y="18" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M18 18v-2a2 2 0 0 1 4 0v2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: 'Vilka uppgifter kan redigeras?',
    body: 'Kontaktuppgifter och personlig information kan redigeras. Om uppgifterna använts för att verifiera din identitet kan du behöva verifiera dig igen vid nästa bokning.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect x="12" y="14" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M16 14v-2a4 4 0 0 1 8 0v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="20" cy="23" r="1.75" fill="currentColor" />
        <path d="M20 25v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Vilken info delas med andra?',
    body: 'Gigtorget delar endast kontaktuppgifter mellan talanger och planerare efter att en bokning bekräftats.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden>
        <path
          d="M4 20s6-9 16-9 16 9 16 9-6 9-16 9S4 20 4 20z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="4.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
]

/** Help card — sits under personal-info rows, same width as the form column. */
export default function PersonalInfoHelpCard() {
  return (
    <div
      className="mt-10 w-full"
      style={{
        borderRadius: 12,
        border: `1px solid ${t.colors.hairline}`,
      }}
    >
      {ITEMS.map((item, i) => (
        <div
          key={item.title}
          className="flex gap-4 px-6 py-6"
          style={{
            borderTop: i === 0 ? 'none' : `1px solid ${t.colors.hairlineSoft}`,
          }}
        >
          <div className="mt-0.5 flex-shrink-0 text-[#DE3151]" aria-hidden>
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-medium leading-[1.25] text-[#222222]">{item.title}</p>
            <p className="mt-1.5 text-[14px] leading-[1.43] text-[#6a6a6a]">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
