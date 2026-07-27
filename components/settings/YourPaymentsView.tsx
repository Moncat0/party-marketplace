import Link from 'next/link'
import { settingsTokens as t } from '@/components/settings/tokens'

export type PaymentRow = {
  id: string
  title: string
  date: string | null
  amountOre: number | null
  status: string | null
}

type Props = {
  payments: PaymentRow[]
  backHref: string
}

const HELP = [
  { href: '/privacy', label: 'Hur fungerar delbetalningar?' },
  { href: '/privacy', label: 'Hur betalar jag för en bokning?' },
  { href: '/privacy', label: 'Var hittar jag min betalning?' },
]

/** Airbnb-style "Your payments" page body. */
export default function YourPaymentsView({ payments, backHref }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <Link
        href={backHref}
        className="mb-6 inline-flex text-[14px] font-medium text-[#222222] underline underline-offset-[3px]"
      >
        ← Tillbaka till betalningar
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-[#222222]">
            Dina betalningar
          </h1>
          <p className="mt-3 max-w-lg text-[16px] leading-[1.5] text-[#6a6a6a]">
            När du har en bokning kan du komma hit för att följa betalningar och återbetalningar.
          </p>

          <div className="mt-10">
            {payments.length === 0 ? (
              <p className="text-[16px] text-[#6a6a6a]">Inga betalningar ännu.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: t.colors.hairlineSoft }}>
                {payments.map(p => (
                  <li key={p.id} className="flex items-start justify-between gap-4 py-5">
                    <div>
                      <p className="text-[16px] font-medium text-[#222222]">{p.title}</p>
                      <p className="mt-1 text-[14px] text-[#6a6a6a]">
                        {[
                          p.date
                            ? new Date(p.date).toLocaleDateString('sv-SE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : null,
                          p.status === 'paid'
                            ? 'Betald'
                            : p.status === 'unpaid'
                              ? 'Obetald'
                              : p.status,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {p.amountOre != null && (
                      <p className="text-[16px] font-medium text-[#222222] tabular-nums">
                        {Math.round(p.amountOre / 100).toLocaleString('sv-SE')} kr
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="lg:col-span-5 lg:pt-2">
          <div
            className="rounded-xl px-5"
            style={{ border: `1px solid ${t.colors.hairlineSoft}` }}
          >
            <p className="pt-5 text-[16px] font-semibold text-[#222222]">Behöver du hjälp?</p>
            <ul>
              {HELP.map((item, i) => (
                <li
                  key={item.label}
                  style={{
                    borderTop: i === 0 ? `1px solid ${t.colors.hairlineSoft}` : undefined,
                    borderBottom:
                      i < HELP.length - 1 ? `1px solid ${t.colors.hairlineSoft}` : undefined,
                    marginTop: i === 0 ? 12 : 0,
                  }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 py-4 text-[16px] font-medium text-[#222222] underline underline-offset-[3px]"
                  >
                    {item.label}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
